const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  drivingLicense: {
    type: String,
    required: true,
  },
  vehicleModel: {
    type: String,
    required: true,
  },
  numberPlate: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  durationHours: {
    type: Number,
    required: true,
  },
  uniqueKey: {
    type: String,
    required: true,
    unique: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true,
  },
  status: {
    type: String,
    enum: ['BOOKED', 'CHECKED_IN', 'COMPLETED', 'EXPIRED'],
    default: 'BOOKED',
  },
  penalty: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);