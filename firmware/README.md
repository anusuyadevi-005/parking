# VisionGuard SmartPark — ESP32 Firmware

This firmware turns an ESP32 into an independent parking station node for the
VisionGuard SmartPark platform. Each node auto-registers with the backend on
boot — **no manual station setup is required**.

## How it works

1. On boot the ESP32 derives a stable `node_id` from its MAC address, e.g. `ESP_A1B2C3`.
2. It calls `POST /api/register-node` with:
   ```json
   { "node_id": "ESP_A1B2C3", "slot_count": 4 }
   ```
   The backend creates a `ParkingStation` + N `Slot` records if one doesn't
   already exist, or updates `last_seen` / slot count if it does.
3. IR sensor transitions are reported via `POST /api/update-occupancy`:
   ```json
   { "node_id": "ESP_A1B2C3", "slot_index": 2, "occupied": true }
   ```
4. The captive portal's `/verify` endpoint calls `POST /api/verify-token` with
   the node's own `node_id`, so the backend can confirm the booking belongs to
   **this** station before opening the gate:
   ```json
   { "node_id": "ESP_A1B2C3", "token": "A7F9K2X" }
   ```
5. A periodic heartbeat re-hits `/api/register-node` every 60 s — the backend
   uses this to mark stations online/offline on the dashboard.

## Hardware

| Pin | Function       |
|-----|----------------|
| 22  | Servo (gate)   |
| 26  | IR sensor 0    |
| 13  | IR sensor 1    |
| 14  | IR sensor 2    |
| 27  | IR sensor 3    |

Add more IR sensors by extending the `IR_PINS[]` array in `parking_node.ino`.
The station's slot count on the backend will automatically adjust on next
registration.

## Dependencies (Arduino IDE)

- WiFi.h (built-in)
- HTTPClient.h (built-in)
- WebServer.h (built-in)
- DNSServer.h (built-in)
- [ESP32Servo](https://github.com/madhephaestus/ESP32Servo)

## Configuration

Edit the top of `parking_node.ino`:

- `wifi_ssid` / `wifi_password` — local WiFi credentials
- `backend_url` — URL of the FastAPI/Express backend
- `IR_PINS[]` — one entry per physical IR sensor

## Dashboard

Registered stations appear automatically at `http://<frontend-host>/dashboard`.
There is no hardcoded station data — if no ESP32 has registered yet, the UI
shows an empty-state with instructions.
