const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path"); // Required for serving static files
const db = require("./config/db");
const log = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const { deletePastEvents } = require("./utils/cronJobs");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

// 🛠️ Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Allow multiple origins
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// 🚀 Cache-Control Headers (Fixes 304 Issues)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// 📂 Serve Uploaded Files
app.use("/uploads", express.static("uploads"));

// 📂 Serve Tickets Specifically
app.use("/uploads/tickets", express.static(path.join(__dirname, "uploads/tickets")));

// 🛣️ Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);

// ❌ Error Handling Middleware (Place at the END)
app.use(errorHandler);

// 🌐 Start the Server After Connecting to Database
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.getConnection(); // Ensure DB is connected
    log("Database connected successfully", "INFO");

    app.listen(PORT, () => {
      log(`🚀 Server running on port ${PORT}`, "INFO");
    });

    // 🔄 Start Cron Jobs (Delete past events)
    deletePastEvents();
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, "ERROR");
    process.exit(1); // Exit process if DB connection fails
  }
};

// 🔥 Start the application
startServer();
