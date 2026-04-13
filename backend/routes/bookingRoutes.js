const express = require('express');
const router = express.Router();
const { 
    getAvailableSlots, 
    createBooking, 
    verifyEntry, 
    calculatePenalty, 
    openGate,
    getUserBookings,
    getGlobalStats,
    checkout
} = require('../controllers/bookingController');

const { protect } = require('../middleware/authMiddleware');

router.get('/slots', getAvailableSlots);
router.get('/all-bookings', protect, getUserBookings);
router.get('/stats', getGlobalStats);
router.post('/create', protect, createBooking);
router.post('/verify', verifyEntry);
router.post('/penalty', calculatePenalty);
router.post('/checkout', checkout);
router.post('/open-gate', openGate); // Simulated IoT endpoint

module.exports = router;