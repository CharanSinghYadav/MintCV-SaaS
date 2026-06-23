/*
========================================================
FILE PURPOSE: server.js (DevOps Commander V2)
========================================================
*/

import 'dotenv/config';
import connectToDB from "./db/connectDB.js";
import app from "./app.js";
import mongoose from "mongoose";

// 🌟 SILENT CRASH CATCHER 1: Uncaught JavaScript exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION DETECTED! Shutting down process...", err);
  process.exit(1);
});

let server;

connectToDB()
  .then(() => {
    const PORT = process.env.PORT || 5000; // Fallback 5000 rakha hai
    
    // 🌟 FIX: "0.0.0.0" added explicitly. Sanjeevani for Render Docker containers!
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 MintCV Production Engine live in [${process.env.NODE_ENV || "development"}] mode at port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Gateway initialization completely failed:", error);
  });

// 🌟 SILENT CRASH CATCHER 2: Unhandled third-party Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION! Terminating gracefully...", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// 🌟 GRACEFUL DEVOPS SHUTDOWN: When Vercel/Render kills your container
const shutdownOperation = async (signal) => {
  console.log(`\n⚠️ Received ${signal}. Initiating secure engine shutdown...`);
  if (server) {
    server.close(async () => {
      await mongoose.connection.close(false);
      console.log("🔒 MongoDB connection pool securely safely detached.");
      process.exit(0);
    });
  }
};

process.on("SIGTERM", () => shutdownOperation("SIGTERM"));
process.on("SIGINT", () => shutdownOperation("SIGINT"));