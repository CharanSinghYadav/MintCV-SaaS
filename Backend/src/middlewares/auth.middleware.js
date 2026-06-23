/*
========================================================
FILE PURPOSE: auth.middleware.js
========================================================

Ye file ek "Bouncer" ya "Security Guard" ki tarah kaam karti hai.

Simple language me:
Kuch routes private hote hain (jaise Dashboard dekhna, Profile edit karna).
In routes tak pahunchne se pehle user ko is bouncer se gujarna padta hai.
Ye bouncer check karega:
1. User ke paas ID card (Token) hai?
2. ID card expire ya cancel (Blacklist) toh nahi ho gaya?
3. ID card asli (Verify) hai ya nakli?
========================================================
*/

import jwt from "jsonwebtoken";
import { BlacklistToken } from "../models/blacklist.model.js";

// Same cookie options as auth.controller for clean flush
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized Request: Token missing" });
        }

        const isTokenBlacklisted = await BlacklistToken.findOne({ token });

        if (isTokenBlacklisted) {
            res.clearCookie("token", cookieOptions);
            return res.status(401).json({ message: "Unauthorized Request: Token is blacklisted" });    
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        
        next();

    } catch (error) {
        // 🌟 FIX: POISONED COOKIE FLUSH (Safe-Catch)
        console.warn("🛡️ Auth Middleware caught invalid token. Flushing cookie...");
        res.clearCookie("token", cookieOptions);
        return res.status(401).json({ message: "Invalid or Expired token" });
    }
};

export default authUser;