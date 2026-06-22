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

// Middleware function me hamesha 'next' parameter hota hai
const authUser = async (req, res, next) => {
    try {
        // 1. Cookie se token nikalo
        const token = req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized Request: Token missing" });
        }

        // 2. Check karo token blacklist me toh nahi hai (Logout toh nahi kar diya tha?)
        const isTokenBlacklisted = await BlacklistToken.findOne({ token });

        if (isTokenBlacklisted) {
            return res.status(401).json({ message: "Unauthorized Request: Token is blacklisted" });    
        }

        // 3. Token ko verify karo JWT Secret se
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Decoded information (jaise user id) ko aage bhej do
        req.user = decodedToken;
        
        // Sab kuch theek hai, ab route ko aage jaane do (Darwaza khol do)
        next();

    } catch (error) {
        // Agar token nakli hai ya expire ho gaya hai toh verify() error throw karta hai
        return res.status(401).json({ message: "Invalid or Expired token" });
    }
};

export default authUser;