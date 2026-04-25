const ParkingStation = require('../models/ParkingStation');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');

const ACTIVE_BOOKING_STATUSES = ['BOOKED', 'CHECKED_IN'];

// Register a new ESP32 node as a parking station
exports.registerNode = async (req, res) => {
  try {
    const { node_id, slot_count } = req.body;

    if (!node_id || !slot_count || slot_count < 1) {
      return res.status(400).json({
        success: false,
        message: 'node_id and slot_count (>=1) are required'
      });
    }

    // Check if station already exists
    let station = await ParkingStation.findOne({ node_id });

    if (station) {
      // Station exists - update last_seen and slot_count if changed
      station.last_seen = new Date();
      station.status = 'online';

      // If slot count changed, adjust slots
      const existingSlots = await Slot.find({ station: station._id });
      if (existingSlots.length !== slot_count) {
        // Remove extra slots if count decreased
        if (existingSlots.length > slot_count) {
          const slotsToDelete = existingSlots.slice(slot_count);
          await Slot.deleteMany({ _id: { $in: slotsToDelete.map(s => s._id) } });
        }
        // Add new slots if count increased
        if (existingSlots.length < slot_count) {
          const newSlots = [];
          for (let i = existingSlots.length; i < slot_count; i++) {
            newSlots.push({
              slotNumber: `${station.name}-${i}`,
              station: station._id,
              slot_index: i,
              location: 'FUNMALL',
              isAvailable: true,
            });
          }
          await Slot.insertMany(newSlots);
        }
      }

      await station.save();

      // Fetch updated slots
      const slots = await Slot.find({ station: station._id }).sort({ slot_index: 1 });

      return res.json({
        success: true,
        message: 'Station updated',
        data: {
          station_id: station._id,
          node_id: station.node_id,
          name: station.name,
          slot_count: station.slot_count,
          status: station.status,
          slots: slots.map(s => ({
            slot_index: s.slot_index,
            slotNumber: s.slotNumber,
            isAvailable: s.isAvailable,
          })),
        },
      });
    }

    // Create new station
    station = new ParkingStation({
      node_id,
      slot_count,
      status: 'online',
    });
    await station.save();

    // Create slots for this station
    const slots = [];
    for (let i = 0; i < slot_count; i++) {
      slots.push({
        slotNumber: `${station.name}-${i}`,
        station: station._id,
        slot_index: i,
        location: 'FUNMALL',
        isAvailable: true,
      });
    }
    await Slot.insertMany(slots);

    res.status(201).json({
      success: true,
      message: 'Station registered successfully',
      data: {
        station_id: station._id,
        node_id: station.node_id,
        name: station.name,
        slot_count: station.slot_count,
        status: station.status,
        slots: slots.map(s => ({
          slot_index: s.slot_index,
          slotNumber: s.slotNumber,
          isAvailable: s.isAvailable,
        })),
      },
    });

  } catch (err) {
    console.error('Register node error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Update occupancy status from ESP32 sensor
exports.updateOccupancy = async (req, res) => {
  try {
    const { node_id, slot_index, occupied } = req.body;

    if (!node_id || slot_index === undefined || occupied === undefined) {
      return res.status(400).json({
        success: false,
        message: 'node_id, slot_index, and occupied are required'
      });
    }

    // Find the station
    const station = await ParkingStation.findOne({ node_id });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found. Register node first.'
      });
    }

    // Find the specific slot
    const slot = await Slot.findOne({ station: station._id, slot_index });
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Slot ${slot_index} not found for station ${node_id}`
      });
    }

    if (occupied) {
      slot.isAvailable = false;
    } else {
      // Car has physically left — sensor is the source of truth, free the slot
      slot.isAvailable = true;

      // Auto-complete any active booking so the slot doesn't stay locked
      const activeBooking = await Booking.findOne({
        slotId: slot._id,
        status: { $in: ACTIVE_BOOKING_STATUSES }
      });
      if (activeBooking) {
        activeBooking.status = 'COMPLETED';
        await activeBooking.save();
      }
    }

    await slot.save();

    // Treat every occupancy report as a heartbeat — refresh last_seen + online status
    station.last_seen = new Date();
    station.status = 'online';
    await station.save();

    res.json({
      success: true,
      message: 'Occupancy updated',
      data: {
        node_id,
        slot_index,
        isAvailable: slot.isAvailable,
        slotNumber: slot.slotNumber,
      },
    });

  } catch (err) {
    console.error('Update occupancy error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Verify token for gate access (scoped to specific station)
exports.verifyToken = async (req, res) => {
  try {
    const { node_id, token } = req.body;
    const normalizedToken = String(token || '').trim().toUpperCase();

    if (!node_id || !normalizedToken) {
      return res.status(400).json({
        success: false,
        message: 'node_id and token are required'
      });
    }

    // Find the station
    const station = await ParkingStation.findOne({ node_id });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Find booking by token
    const booking = await Booking.findOne({ uniqueKey: normalizedToken }).populate('slotId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const bookingStationId = booking.slotId?.station ? booking.slotId.station.toString() : null;
    const sameStation = bookingStationId === station._id.toString();
    const mainMallFallback = !bookingStationId && booking.slotId?.location === 'FUNMALL';

    // Allow older FUNMALL bookings that predate per-station slot records.
    if (!booking.slotId || (!sameStation && !mainMallFallback)) {
      return res.status(403).json({
        success: false,
        message: 'Token not valid for this station'
      });
    }

    // Check booking status
    const now = new Date();
    if (booking.status === 'EXPIRED') {
      return res.status(403).json({
        success: false,
        message: 'Booking expired',
        penalty: booking.penalty
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Booking already completed'
      });
    }

    // Update status to checked in
    if (booking.status === 'BOOKED') {
      booking.status = 'CHECKED_IN';
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Access granted',
      data: {
        slotNumber: booking.slotId?.slotNumber,
        vehicleNumber: booking.numberPlate,
      },
    });

  } catch (err) {
    console.error('Verify token error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Get all stations with real-time occupancy
exports.getStations = async (req, res) => {
  try {
    const stations = await ParkingStation.find().sort({ createdAt: 1 });

    // Mark stations offline if they haven't checked in within 3 minutes
    const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000;
    const now = Date.now();

    const result = [];
    for (const station of stations) {
      const slots = await Slot.find({ station: station._id }).sort({ slot_index: 1 });
      const occupiedCount = slots.filter(s => !s.isAvailable).length;

      // Derive current online/offline status from last_seen
      const lastSeenAgeMs = now - new Date(station.last_seen).getTime();
      const currentStatus = lastSeenAgeMs < OFFLINE_THRESHOLD_MS ? 'online' : 'offline';
      if (station.status !== currentStatus) {
        station.status = currentStatus;
        await station.save();
      }

      result.push({
        station_id: station._id,
        node_id: station.node_id,
        name: station.name,
        status: currentStatus,
        last_seen: station.last_seen,
        slot_count: station.slot_count,
        occupied_count: occupiedCount,
        free_count: station.slot_count - occupiedCount,
        occupancy_percent: station.slot_count > 0
          ? Math.round((occupiedCount / station.slot_count) * 100)
          : 0,
        slots: slots.map(s => ({
          slot_index: s.slot_index,
          slotNumber: s.slotNumber,
          isAvailable: s.isAvailable,
        })),
      });
    }

    res.json({
      success: true,
      data: {
        total_stations: stations.length,
        stations: result,
      },
    });

  } catch (err) {
    console.error('Get stations error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Checkout / exit gate verification (scoped to specific station)
exports.checkoutToken = async (req, res) => {
  try {
    const { node_id, token } = req.body;
    const normalizedToken = String(token || '').trim().toUpperCase();

    if (!node_id || !normalizedToken) {
      return res.status(400).json({ success: false, message: 'node_id and token are required' });
    }

    const station = await ParkingStation.findOne({ node_id });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const booking = await Booking.findOne({ uniqueKey: normalizedToken }).populate('slotId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invalid token' });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Booking already completed' });
    }

    if (booking.status === 'EXPIRED') {
      return res.status(403).json({ success: false, message: `Booking expired. Penalty: ₹${booking.penalty}` });
    }

    // Mark booking completed and free the slot
    booking.status = 'COMPLETED';
    await booking.save();

    if (booking.slotId) {
      await Slot.findByIdAndUpdate(booking.slotId._id, { isAvailable: true });
    }

    res.json({
      success: true,
      message: 'Exit granted. Slot is now free.',
      data: {
        slotNumber: booking.slotId?.slotNumber,
        vehicleNumber: booking.numberPlate,
      },
    });

  } catch (err) {
    console.error('Checkout token error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Legacy wrapper for backward compatibility
exports.getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ isAvailable: true }).populate('station');
    res.json({ success: true, count: slots.length, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
