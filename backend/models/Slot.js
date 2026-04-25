const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingStation',
    required: true,
  },
  slot_index: {
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    enum: ['FUNMALL', 'NEARBY', 'SCHOOL', 'COLLEGE'],
    default: 'FUNMALL',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound index for unique slot per station
slotSchema.index({ station: 1, slot_index: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);