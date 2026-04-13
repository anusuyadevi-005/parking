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
app.use("/api/booking", bookingRoutes);
app.use("/api/auth", authRoutes);

// Models
const Slot = require("./models/Slot");
const Booking = require("./models/Booking");
const User = require("./models/User"); // Added User model

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");

  // Seed database after DB connect
  seedDatabase();
})
.catch(err => console.log(err));

// Seed Initial Data (Slots and Admin User)
const seedDatabase = async () => {
  try {
    // Seed Slots
    const slotCount = await Slot.countDocuments();
    if (slotCount === 0) {
      console.log('Seeding slots...');
      const slots = [];
      // Row A1-A12
      for (let i = 1; i <= 12; i++) {
        slots.push({ slotNumber: `A${i}`, location: 'FUNMALL', isAvailable: true });
      }
      // Row B1-B12
      for (let i = 1; i <= 12; i++) {
        slots.push({ slotNumber: `B${i}`, location: 'FUNMALL', isAvailable: true });
      }
      // Row C1-C10
      for (let i = 1; i <= 10; i++) {
        slots.push({ slotNumber: `C${i}`, location: 'FUNMALL', isAvailable: true });
      }
      // Nearby overflow
      for (let i = 1; i <= 5; i++) {
        slots.push({ slotNumber: `N${i}`, location: 'NEARBY', isAvailable: true });
      }
      // Gate-only overflow (Schools/Colleges)
      slots.push({ slotNumber: `SCHOOL-GATE`, location: 'SCHOOL', isAvailable: true });
      slots.push({ slotNumber: `COLLEGE-GATE`, location: 'COLLEGE', isAvailable: true });

      await Slot.insertMany(slots);
      console.log('Slots seeded successfully!');
    } else {
      // Check if SCHOOL/COLLEGE are missing and add them
      const schoolExists = await Slot.findOne({ location: 'SCHOOL' });
      if (!schoolExists) {
        await Slot.create({ slotNumber: 'SCHOOL-GATE', location: 'SCHOOL', isAvailable: true });
        console.log('Added SCHOOL overflow area.');
      }
      const collegeExists = await Slot.findOne({ location: 'COLLEGE' });
      if (!collegeExists) {
        await Slot.create({ slotNumber: 'COLLEGE-GATE', location: 'COLLEGE', isAvailable: true });
        console.log('Added COLLEGE overflow area.');
      }
    }

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

    const bookings = await Booking.find({ status: "BOOKED" });

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
}, 60000); // every 1 minute

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));