/*
========================================================
FILE PURPOSE: connectDB.js 
========================================================

Ye file MongoDB database ko hamare Node.js backend se connect karti hai.

Simple language me:
Bina database ke hamara backend user ka data (jaise resumes) 
kaha save karega? Kahi nahi! 
Isliye server start hote hi sabse pehle hum DB connect karte hain.
========================================================
*/

/*
========================================================
FILE PURPOSE: connectDB.js (Production Hardened)
========================================================
*/

import mongoose from "mongoose";

// StrictQuery warning fix for modern Mongoose
mongoose.set('strictQuery', true);

async function connectToDB() {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      // 🌟 PRODUCTION RESILIENCE SETTINGS
      serverSelectionTimeoutMS: 5000, // 5 second tak connection dhoondho, fir give up karo
      socketTimeoutMS: 45000,         // 45 sec inactive rehne pe socket auto-close karo
      maxPoolSize: 50,                // Atlas Free tier friendly connection pool
    });
    
    console.log(`🟢 MongoDB Connected! DB HOST: ${connectionInstance.connection.host}`);

    // 🌟 RUNTIME DROP DETECTORS
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB lost connection! Engine attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Runtime Critical Error:', err);
    });

  } catch (error) {
    console.log("❌ MongoDB Connection FAILED at Startup: ", error.message);
    process.exit(1);
  }
}

export default connectToDB;