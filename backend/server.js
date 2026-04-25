const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const stationRoutes = require("./routes/stationRoutes");
app.use("/api/booking", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", stationRoutes);

// Models
const Slot = require("./models/Slot");
const Booking = require("./models/Booking");
const User = require("./models/User");
const ParkingStation = require("./models/ParkingStation");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");

  // Seed database after DB connect
  seedDatabase();
})
.catch(err => console.log(err));

// Seed Initial Data (Admin User Only - Slots come from ESP32 registration)
const seedDatabase = async () => {
  try {
    // Seed Admin User
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      console.log('Seeding admin user...');
      const admin = new User({
        name: 'System Administrator',
        username: 'admin',
        password: 'adminpassword', // Will be hashed by pre-save hook
        phone: '0000000000',
        licenseNumber: 'ADMIN-SYS',
        vehicleModel: 'N/A',
        numberPlate: 'N/A',
        role: 'ADMIN'
      });
      await admin.save();
      console.log('Admin user seeded (admin / adminpassword)');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

// 🚀 EXPIRY + PENALTY SYSTEM
setInterval(async () => {
  try {
    const now = new Date();

    const bookings = await Booking.find({ status: { $in: ["BOOKED", "CHECKED_IN"] } });

    for (let b of bookings) {
      // ⏳ Time left (seconds)
      const timeLeft = (b.endTime - now) / 1000;

      // 🔔 5 minutes before expiry
      if (timeLeft <= 300 && timeLeft > 0) {
        console.log(`⚠️ Booking ${b.uniqueKey} expires in 5 minutes`);
      }

      // ❌ Expired (with 5-minute grace period)
      const fiveMinutesAfterEnd = new Date(b.endTime.getTime() + 300000);
      if (now > fiveMinutesAfterEnd) {
        const extraMinutes = Math.max(0, Math.floor((now - b.endTime) / (1000 * 60)));
        const penalty = extraMinutes * 2; // ₹2 per minute

        b.status = "EXPIRED";
        b.penalty = penalty;
        await b.save();

        // Free slot
        const slot = await Slot.findById(b.slotId);
        if (slot) {
          slot.isAvailable = true;
          await slot.save();
        }

        console.log(`❌ Booking ${b.uniqueKey} expired. Penalty: ₹${penalty}`);
      }
    }
  } catch (err) {
    console.log("Expiry Error:", err.message);
  }
}, 60000);

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));