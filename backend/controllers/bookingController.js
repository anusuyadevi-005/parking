const Slot = require('../models/Slot');
const Booking = require('../models/Booking');

// Utility to generate a unique alphanumeric key
const generateUniqueKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let length = Math.floor(Math.random() * 3) + 6; // 6 to 8 chars
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const now = new Date();
    
    const gracePeriod = 5 * 60 * 1000;
    const expiryThreshold = new Date(now.getTime() - gracePeriod);
    
    // Auto-release slots whose booking time has passed (with grace period)
    const expiredBookings = await Booking.find({
      endTime: { $lt: expiryThreshold },
      status: { $in: ['BOOKED', 'CHECKED_IN'] }
    });

    for (let booking of expiredBookings) {
      booking.status = 'EXPIRED';
      await booking.save();
      
      // Release the slot
      await Slot.findByIdAndUpdate(booking.slotId, { isAvailable: true });
    }

    const slots = await Slot.find({ isAvailable: true });
    res.json({ success: true, count: slots.length, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { 
      drivingLicense, 
      vehicleModel, 
      numberPlate, 
      date, 
      time, 
      durationHours, 
      slotPreference,
      locationPreference 
    } = req.body;
 
    // Validate if any slots are available
    let availableSlot;
    
    // 1. Try specific slot number if provided
    if (slotPreference) {
      availableSlot = await Slot.findOne({ slotNumber: slotPreference, isAvailable: true });
    }
 
    // 2. Try specific location if provided
    if (!availableSlot && locationPreference) {
      // For School/College, they are always available (gate-only)
      availableSlot = await Slot.findOne({ location: locationPreference });
    }

    // 3. Automated Fallback Chain
    if (!availableSlot) {
      availableSlot = await Slot.findOne({ isAvailable: true, location: 'FUNMALL' });
    }
 
    if (!availableSlot) {
      availableSlot = await Slot.findOne({ isAvailable: true, location: 'NEARBY' });
    }
 
    if (!availableSlot) {
      availableSlot = await Slot.findOne({ location: 'SCHOOL' });
    }
 
    if (!availableSlot) {
      availableSlot = await Slot.findOne({ location: 'COLLEGE' });
    }
 
    if (!availableSlot) {
      return res.status(400).json({ success: false, message: 'Selected or any other parking slots are not available.' });
    }

    // Parse start time and calculate end time
    const startDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(startDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date or time format.' });
    }

    const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

    // Generate unique key
    let uniqueKey = generateUniqueKey();
    let keyExists = await Booking.findOne({ uniqueKey });
    while (keyExists) {
      uniqueKey = generateUniqueKey();
      keyExists = await Booking.findOne({ uniqueKey });
    }

    // Calculate Price
    const baseRate = 5.00; // $5 per hour
    const convenienceFee = 0.75;
    let surcharge = 0;
    
    if (availableSlot.location === 'SCHOOL' || availableSlot.location === 'COLLEGE') {
      surcharge = 10.00; // $10 extra for overflow allocation
    }
    
    const totalAmount = (durationHours * baseRate) + convenienceFee + surcharge;

    const booking = new Booking({
      drivingLicense,
      vehicleModel,
      numberPlate,
      startTime: startDateTime,
      endTime: endDateTime,
      durationHours,
      uniqueKey,
      slotId: availableSlot._id,
      status: 'BOOKED',
      totalAmount
    });

    await booking.save();

    // Mark slot as unavailable ONLY if it's not a gate-only overflow area
    if (availableSlot.location !== 'SCHOOL' && availableSlot.location !== 'COLLEGE') {
      availableSlot.isAvailable = false;
      await availableSlot.save();
    }

    res.status(201).json({ 
      success: true, 
      message: 'Booking successful', 
      data: {
        bookingId: booking._id,
        uniqueKey: booking.uniqueKey,
        slotNumber: availableSlot.slotNumber,
        location: availableSlot.location,
        totalAmount: booking.totalAmount,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation Error', error: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error (maybe key collision). Try again.', error: err.message });
    }
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

exports.verifyEntry = async (req, res) => {
  try {
    const { uniqueKey } = req.body;

    if (!uniqueKey) {
      return res.status(400).json({ success: false, message: 'Please provide a unique key.' });
    }

    const booking = await Booking.findOne({ uniqueKey }).populate('slotId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid Key. Access Denied.' });
    }

    const now = new Date();

    if (booking.status === 'EXPIRED') {
       return res.status(403).json({ success: false, message: `Booking has expired. Penalty to be paid: ₹${booking.penalty}` });
    }

    if (booking.status === 'COMPLETED') {
       return res.status(403).json({ success: false, message: 'This key has already been used and the booking is completed.' });
    }

    // Check if it's too early to enter. E.g., allow entry 15 mins before start time? (Optional)
    // For now, let's keep it simple: allow if it's booked and not expired.

    // Update status
    if (booking.status === 'BOOKED') {
      booking.status = 'CHECKED_IN';
      await booking.save();
    }

    // Simulate IoT Open Gate
    // IoT command logic would go here

    res.json({
      success: true,
      message: 'Access Granted. Gate Opening...',
      data: {
        slotNumber: booking.slotId.slotNumber,
        location: booking.slotId.location,
        vehicleNumber: booking.numberPlate
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.calculatePenalty = async (req, res) => {
  try {
     const { uniqueKey } = req.body;
     const booking = await Booking.findOne({ uniqueKey });
     
     if(!booking) {
         return res.status(404).json({ success: false, message: 'Booking not found' });
     }

     if(booking.status !== 'EXPIRED' && booking.status !== 'CHECKED_IN') {
        return res.status(400).json({ success: false, message: 'No penalty applicable at this state.' });
     }

     const now = new Date();
     let extraMinutes = 0;
     let penaltyToPay = booking.penalty;

     // Calculate dynamic penalty if still checked in but time exceeded
     if(now > booking.endTime) {
         extraMinutes = Math.floor((now - booking.endTime) / (1000 * 60));
         penaltyToPay = Math.max(penaltyToPay, extraMinutes * 50); // ₹50/hour fine? Or ₹50 per minute? Requirements said "e.g., ₹50/hour". Let's do ₹1 per minute (₹60/hr approx) to follow typical logic, or just code Math.ceil(extraMinutes/60) * 50
         penaltyToPay = Math.ceil(extraMinutes / 60) * 50; 
     }

     res.json({
         success: true,
         penalty: penaltyToPay,
         extraMinutes
     });

  } catch(err) {
     res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// IoT Simulation - Emergency Open Gate
exports.openGate = async (req, res) => {
    try {
        // Here we could verify an admin token, for now just open
        res.json({ success: true, message: 'EMERGENCY: Gate opened manually.' });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
}

exports.getUserBookings = async (req, res) => {
  try {
    // In a real app, we'd filter by userId. For this MVP, we'll return all bookings.
    const bookings = await Booking.find().populate('slotId').sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const { uniqueKey } = req.body;
    const booking = await Booking.findOne({ uniqueKey }).populate('slotId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Booking already completed.' });
    }

    // Mark booking as completed
    booking.status = 'COMPLETED';
    await booking.save();

    // Make slot available again
    if (booking.slotId) {
      const slot = await Slot.findById(booking.slotId._id);
      if (slot) {
        slot.isAvailable = true;
        await slot.save();
      }
    }

    res.json({ success: true, message: 'Checkout successful. Thank you for parking with us!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getGlobalStats = async (req, res) => {
  try {
    const now = new Date();
    
    const gracePeriod = 5 * 60 * 1000;
    const expiryThreshold = new Date(now.getTime() - gracePeriod);
    
    // Ensure stats are accurate by releasing expired slots first
    const expiredBookings = await Booking.find({
      endTime: { $lt: expiryThreshold },
      status: { $in: ['BOOKED', 'CHECKED_IN'] }
    });

    for (let booking of expiredBookings) {
      booking.status = 'EXPIRED';
      await booking.save();
      await Slot.findByIdAndUpdate(booking.slotId, { isAvailable: true });
    }

    const totalSlots = await Slot.countDocuments();
    const freeSlots = await Slot.countDocuments({ isAvailable: true });
    const totalBookings = await Booking.countDocuments();
    
    // Aggregation for per-location statistics
    const locationStats = await Slot.aggregate([
      {
        $group: {
          _id: "$location",
          total: { $sum: 1 },
          free: { $sum: { $cond: ["$isAvailable", 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSlots,
        freeSlots,
        occupancy: totalSlots > 0 ? Math.round(((totalSlots - freeSlots) / totalSlots) * 100) : 0,
        totalBookings,
        locations: locationStats.map(loc => {
           let name = loc._id;
           let fullName = `${loc._id} Parking`;
           if (loc._id === 'FUNMALL') {
             name = 'Mall Center';
             fullName = 'Mall Center Parking';
           } else if (loc._id === 'SCHOOL') {
             name = 'School Overflow';
             fullName = 'Public School Overflow Area';
           } else if (loc._id === 'COLLEGE') {
             name = 'College Overflow';
             fullName = 'Engineering College Overflow Area';
           }
           
           return {
             name,
             fullName,
             total: loc.total,
             free: loc.free,
             isMain: loc._id === 'FUNMALL'
           };
         })
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};