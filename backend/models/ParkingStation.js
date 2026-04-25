const mongoose = require('mongoose');

const parkingStationSchema = new mongoose.Schema({
  node_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    default: function() {
      return `Station ${this.node_id}`;
    }
  },
  slot_count: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  last_seen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Update last_seen on every save
parkingStationSchema.pre('save', function() {
  this.last_seen = new Date();
  if (this.isModified()) {
    this.status = 'online';
  }
});

module.exports = mongoose.model('ParkingStation', parkingStationSchema);
