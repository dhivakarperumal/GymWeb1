const express = require("express");
const cors = require("cors");
require("dotenv").config();

// optionally run migrations on start, helps when launching dev server
(async () => {
  try {
    const { runMigrations } = require("./src/config/migrate");
    await runMigrations();
    
    const db = require("./src/config/db");
    try {
      // Use SESSION instead of GLOBAL to avoid permission issues on shared hosting
      await db.query("SET SESSION max_allowed_packet = 67108864"); 
      console.log("✅ MySQL session max_allowed_packet increased to 64MB");
    } catch (dbErr) {
      console.warn("⚠️ Could not set max_allowed_packet session variable:", dbErr.message);
    }
  } catch (err) {
    console.error("migration startup error:", err.message);
  }
})();

// Import routes
const productRoutes = require("./src/routes/productRoutes");
const memberRoutes = require("./src/routes/memberRoutes");
const planRoutes = require("./src/routes/planRoutes");
const facilityRoutes = require("./src/routes/facilityRoutes");
const equipmentRoutes = require("./src/routes/equipmentRoutes");
const staffRoutes = require("./src/routes/staffRoutes");
const serviceRoutes = require("./src/routes/serviceRoutes");
const authRoutes = require("./src/routes/authRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const userRoutes = require("./src/routes/userRoutes");
const workoutRoutes = require("./src/routes/workoutRoutes");
const enquiryRoutes = require("./src/routes/enquiryRoutes");
const dietRoutes = require("./src/routes/dietRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const checkinRoutes = require("./src/routes/checkinRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");
const ptFormRoutes = require("./src/routes/ptFormRoutes");
const followupRoutes = require("./src/routes/followupRoutes");
const sessionRoutes = require("./src/routes/sessionRoutes");
const offerRoutes = require("./src/routes/offerRoutes");

const app = express();

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ✅ EXACT CORS FIX - Allow multiple ports */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const url = new URL(origin);
        const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        if (isLocalhost) return callback(null, true);
      } catch (err) {}
      const allowed = ["https://dap.qtechx.com"];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// DB routes
app.use("/api/auth", authRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/diet-plans", dietRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/checkins", checkinRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/send-message", messageRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/pt-forms", ptFormRoutes);
app.use("/api/followups", followupRoutes);
app.use("/api/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;
