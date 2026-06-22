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

const authUser = async (req, res, next) => {
    try {
        // 🔥 FIX: Token ko Cookie me dhoondo, ya fir 'Authorization' header me dhoondo
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized Request: Token missing" });
        }

        const isTokenBlacklisted = await BlacklistToken.findOne({ token });

        if (isTokenBlacklisted) {
            return res.status(401).json({ message: "Unauthorized Request: Token is blacklisted" });    
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired token" });
    }
};

export default authUser;