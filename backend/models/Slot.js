const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    enum: ['FUNMALL', 'NEARBY', 'SCHOOL', 'COLLEGE'],
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Slot', slotSchema);