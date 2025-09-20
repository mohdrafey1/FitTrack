const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI =
            process.env.MONGODB_URI || "mongodb://localhost:27017/fittrack";
        await mongoose.connect(mongoURI);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

// Basic Routes
app.get("/", (req, res) => {
    res.json({
        message: "FitTrack API Server",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        database:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));

// 404 Handler
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        timestamp: new Date().toISOString(),
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    mongoose.connection.close(() => {
        console.log("MongoDB connection closed.");
        process.exit(0);
    });
});

module.exports = app;
