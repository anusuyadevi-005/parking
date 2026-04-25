const express = require('express');
const router = express.Router();
const {
  registerNode,
  updateOccupancy,
  verifyToken,
  getStations,
  getAvailableSlots,
} = require('../controllers/stationController');

// ESP32 node registration
router.post('/register-node', registerNode);

// ESP32 sensor updates
router.post('/update-occupancy', updateOccupancy);

// Token verification for gate access
router.post('/verify-token', verifyToken);

// Get all stations with occupancy
router.get('/stations', getStations);

// Legacy endpoint for backward compatibility
router.get('/slots', getAvailableSlots);

module.exports = router;
