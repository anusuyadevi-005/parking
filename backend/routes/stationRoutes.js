const express = require('express');
const router = express.Router();
const {
  registerNode,
  updateOccupancy,
  verifyToken,
  checkoutToken,
  getStations,
  getAvailableSlots,
} = require('../controllers/stationController');

// ESP32 node registration
router.post('/register-node', registerNode);

// ESP32 sensor updates
router.post('/update-occupancy', updateOccupancy);

// Token verification for entry gate
router.post('/verify-token', verifyToken);

// Token verification for exit gate (checkout)
router.post('/checkout-token', checkoutToken);

// Get all stations with occupancy
router.get('/stations', getStations);

// Legacy endpoint for backward compatibility
router.get('/slots', getAvailableSlots);

module.exports = router;
