import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

// Station/ESP32 endpoints
export const registerNode = (node_id, slot_count) =>
  API.post("/register-node", { node_id, slot_count });

export const updateOccupancy = (node_id, slot_index, occupied) =>
  API.post("/update-occupancy", { node_id, slot_index, occupied });

export const verifyToken = (node_id, token) =>
  API.post("/verify-token", { node_id, token });

export const getStations = () =>
  API.get("/stations", {
    params: { t: Date.now() },
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

// Legacy booking endpoints
export const getAvailableSlots = () =>
  API.get("/booking/slots");

export const getStats = () =>
  API.get("/booking/stats");

export default API;
