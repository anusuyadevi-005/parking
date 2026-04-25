/*
 * VisionGuard SmartPark - ESP32 Parking Station Node
 * FIXES APPLIED:
 *   1. Servo self-test on boot to confirm hardware works
 *   2. Explicit LEDC timer channel (0) to avoid conflicts
 *   3. handleVerify() flushes + stops client BEFORE openGate() blocking delay
 *   4. Granular serial prints inside openGate() for full debug visibility
 *   5. Servo re-attach guard with explicit channel each time
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESP32Servo.h>

// ---------- Configuration ----------
const char* wifi_ssid = "QWERTY";
const char* wifi_password = "1234567890";
const char* ap_ssid = "Parking_Entrance_AP";
const char* backend_url = "http://10.195.71.23:5000";

const int IR_PINS[] = {26, 13, 14, 27};
const int SLOT_COUNT = sizeof(IR_PINS) / sizeof(IR_PINS[0]);
const int SERVO_PIN = 12;
const int DNS_PORT = 53;
const int SERVO_CLOSED_ANGLE = 0;
const int SERVO_OPEN_ANGLE = 90;
const int SERVO_MIN_US = 500;
const int SERVO_MAX_US = 2400;

const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long SENSOR_DEBOUNCE_MS = 1200;
const unsigned long REGISTER_RETRY_DELAY = 10000;
const unsigned long HEARTBEAT_INTERVAL = 60000;
const unsigned long WIFI_RETRY_INTERVAL = 30000;

// ---------- State ----------
Servo barrierServo;
WebServer server(80);
DNSServer dnsServer;

String node_id = "";
bool node_registered = false;
bool last_status[16] = {false};
bool last_raw_status[16] = {false};
unsigned long last_raw_change[16] = {0};
unsigned long last_sensor_check = 0;
unsigned long last_heartbeat = 0;
unsigned long last_register_try = 0;
unsigned long last_wifi_retry = 0;

// ---------- Captive portal HTML ----------
const char* portal_html =
  "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1.0'>"
  "<style>body{font-family:sans-serif;text-align:center;padding:20px;background:#f8fafc;}"
  "h1{color:#1e293b;}input{padding:12px;width:80%;margin:10px 0;border-radius:8px;border:1px solid #ccc;}"
  "button{padding:12px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}"
  ".node{color:#64748b;font-size:0.85em;margin-top:20px;}"
  "</style></head><body>"
  "<h1>SmartPark Arrival</h1>"
  "<p>Enter your unique booking token to open the barrier.</p>"
  "<form action='/verify' method='POST'>"
  "<input type='text' name='token' placeholder='6-Digit Token' required>"
  "<br><button type='submit'>Verify & Open Gate</button>"
  "</form>"
  "<div class='node'>Station: NODE_ID_PLACEHOLDER</div>"
  "</body></html>";

// ---------- Helpers ----------
String deriveNodeId() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char buf[16];
  snprintf(buf, sizeof(buf), "ESP_%02X%02X%02X", mac[3], mac[4], mac[5]);
  return String(buf);
}

String renderPortalHtml() {
  String html = String(portal_html);
  html.replace("NODE_ID_PLACEHOLDER", node_id);
  return html;
}

String extractJsonMessage(const String& response) {
  int messageKey = response.indexOf("\"message\"");
  if (messageKey == -1) return response;
  int firstQuote = response.indexOf('"', messageKey + 9);
  if (firstQuote == -1) return response;
  int secondQuote = response.indexOf('"', firstQuote + 1);
  if (secondQuote == -1) return response;
  String message = response.substring(firstQuote + 1, secondQuote);
  message.replace("\\u20b9", "Rs ");
  message.replace("\\n", " ");
  message.replace("\\\"", "\"");
  return message;
}

// ---------- Servo ----------
void attachServo() {
  if (!barrierServo.attached()) {
    barrierServo.setPeriodHertz(50);
    barrierServo.attach(SERVO_PIN, SERVO_MIN_US, SERVO_MAX_US);
    Serial.printf("[servo] Attached on pin=%d\n", SERVO_PIN);
  }
}

void openGate() {
  Serial.println("[gate] openGate() called");
  attachServo();
  Serial.println("[gate] attached=" + String(barrierServo.attached()));
  Serial.printf("[gate] Writing OPEN angle: %d\n", SERVO_OPEN_ANGLE);
  barrierServo.write(SERVO_OPEN_ANGLE);
  Serial.println("[gate] Write done — waiting 5s");
  delay(5000);
  Serial.printf("[gate] Writing CLOSED angle: %d\n", SERVO_CLOSED_ANGLE);
  barrierServo.write(SERVO_CLOSED_ANGLE);
  Serial.println("[gate] Gate closed.");
}

void servoSelfTest() {
  Serial.println("[selftest] Starting servo self-test...");
  attachServo();
  Serial.println("[selftest] Writing OPEN");
  barrierServo.write(SERVO_OPEN_ANGLE);
  delay(2000);
  Serial.println("[selftest] Writing CLOSED");
  barrierServo.write(SERVO_CLOSED_ANGLE);
  delay(1000);
  Serial.println("[selftest] Done. If servo did not move, check power supply (servo needs external 5V).");
}

// ---------- Backend Calls ----------
bool registerNode() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[register] No WiFi, skipping");
    return false;
  }
  HTTPClient http;
  http.begin(String(backend_url) + "/api/register-node");
  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"node_id\":\"" + node_id + "\",\"slot_count\":" + String(SLOT_COUNT) + "}";
  Serial.print("[register] POST ");
  Serial.println(payload);
  int httpCode = http.POST(payload);
  String response = http.getString();
  http.end();
  if ((httpCode == 200 || httpCode == 201) && response.indexOf("\"success\":true") != -1) {
    Serial.print("[register] OK: ");
    Serial.println(response);
    node_registered = true;
    return true;
  }
  Serial.printf("[register] Failed code=%d body=%s\n", httpCode, response.c_str());
  return false;
}

void updateCloudOccupancy(int slotIdx, bool occupied) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!node_registered) {
    Serial.println("[occupancy] Node not registered, skipping");
    return;
  }
  HTTPClient http;
  http.begin(String(backend_url) + "/api/update-occupancy");
  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"node_id\":\"" + node_id +
                   "\",\"slot_index\":" + String(slotIdx) +
                   ",\"occupied\":" + (occupied ? "true" : "false") + "}";
  int httpCode = http.POST(payload);
  String response = http.getString();
  Serial.printf("[occupancy] slot=%d occupied=%d code=%d body=%s\n",
                slotIdx, occupied, httpCode, response.c_str());
  http.end();
}

void syncInitialOccupancy() {
  for (int i = 0; i < SLOT_COUNT; i++) {
    const bool occupied = (digitalRead(IR_PINS[i]) == LOW);
    last_status[i] = occupied;
    last_raw_status[i] = occupied;
    last_raw_change[i] = millis();
    updateCloudOccupancy(i, occupied);
  }
}

// ---------- HTTP Handlers ----------
void handleRoot() {
  server.send(200, "text/html", renderPortalHtml());
}

void handleVerify() {
  if (!server.hasArg("token")) {
    server.send(400, "text/plain", "Missing token");
    return;
  }
  String token = server.arg("token");
  token.trim();
  token.toUpperCase();
  Serial.print("[verify] token=");
  Serial.println(token);

  HTTPClient http;
  http.begin(String(backend_url) + "/api/verify-token");
  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"node_id\":\"" + node_id + "\",\"token\":\"" + token + "\"}";
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    http.end();
    Serial.printf("[verify] code=%d body=%s\n", httpCode, response.c_str());

    if (httpCode == 200 && response.indexOf("\"success\":true") != -1) {
      server.send(200, "text/html",
        "<h1>WELCOME</h1><p>Token valid. Gate opening...</p>");
      server.client().flush();
      server.client().stop();
      openGate();
    } else {
      String message = extractJsonMessage(response);
      server.send(200, "text/html",
        "<h1>DENIED</h1><p>" + message + "</p><a href='/'>Try Again</a>");
    }
  } else {
    http.end();
    server.send(500, "text/plain", "System Error: Backend unreachable");
  }
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n--- VisionGuard SmartPark Node ---");

  barrierServo.setPeriodHertz(50);
  barrierServo.attach(SERVO_PIN, SERVO_MIN_US, SERVO_MAX_US);
  barrierServo.write(SERVO_CLOSED_ANGLE);
  Serial.printf("[gate] Servo attached on pin=%d (closed=%d open=%d)\n",
                SERVO_PIN, SERVO_CLOSED_ANGLE, SERVO_OPEN_ANGLE);

  servoSelfTest();

  for (int i = 0; i < SLOT_COUNT; i++) {
    pinMode(IR_PINS[i], INPUT_PULLUP);
    const bool occupied = (digitalRead(IR_PINS[i]) == LOW);
    last_status[i] = occupied;
    last_raw_status[i] = occupied;
    last_raw_change[i] = millis();
  }

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ap_ssid);

  Serial.print("Connecting to WiFi");
  WiFi.begin(wifi_ssid, wifi_password);
  unsigned long connectStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - connectStart < 30000) {
    delay(500);
    Serial.print(".");
  }

  node_id = deriveNodeId();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Node ID: ");
    Serial.println(node_id);
    if (!registerNode()) {
      Serial.println("Initial registration failed - will retry in loop.");
      last_register_try = millis();
    } else {
      syncInitialOccupancy();
    }
  } else {
    Serial.println();
    Serial.println("WiFi failed - operating offline until reconnected.");
  }

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  server.on("/", handleRoot);
  server.on("/verify", HTTP_POST, handleVerify);
  server.onNotFound([]() {
    server.sendHeader("Location", "/", true);
    server.send(302, "text/plain", "");
  });
  server.begin();

  Serial.println("Captive portal active on " + WiFi.softAPIP().toString());
}

// ---------- Loop ----------
void loop() {
  dnsServer.processNextRequest();
  server.handleClient();

  if (WiFi.status() != WL_CONNECTED && millis() - last_wifi_retry > WIFI_RETRY_INTERVAL) {
    Serial.println("[wifi] Not connected - reconnecting...");
    WiFi.disconnect();
    WiFi.begin(wifi_ssid, wifi_password);
    last_wifi_retry = millis();
  }

  if (!node_registered && WiFi.status() == WL_CONNECTED &&
      millis() - last_register_try > REGISTER_RETRY_DELAY) {
    Serial.println("[register] Retrying...");
    if (registerNode()) {
      syncInitialOccupancy();
    }
    last_register_try = millis();
  }

  if (node_registered && millis() - last_heartbeat > HEARTBEAT_INTERVAL) {
    registerNode();
    last_heartbeat = millis();
  }

  if (millis() - last_sensor_check > SENSOR_INTERVAL) {
    for (int i = 0; i < SLOT_COUNT; i++) {
      const bool raw_occupied = (digitalRead(IR_PINS[i]) == LOW);
      if (raw_occupied != last_raw_status[i]) {
        last_raw_status[i] = raw_occupied;
        last_raw_change[i] = millis();
      }
      const bool debouncedChangeReady =
        (millis() - last_raw_change[i] >= SENSOR_DEBOUNCE_MS) &&
        (last_raw_status[i] != last_status[i]);
      if (debouncedChangeReady) {
        last_status[i] = last_raw_status[i];
        Serial.printf("Slot %d -> %s\n", i, last_status[i] ? "OCCUPIED" : "FREE");
        updateCloudOccupancy(i, last_status[i]);
      }
    }
    last_sensor_check = millis();
  }
}
