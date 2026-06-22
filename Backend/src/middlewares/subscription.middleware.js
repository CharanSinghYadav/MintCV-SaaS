/*
========================================================
FILE PURPOSE: subscription.middleware.js
========================================================
Ye middleware "Route-Aware" Bouncer hai.
1. 'Enhance' API ko completely lock karta hai free users ke liye.
2. 'Upload PDF' aur 'ATS Scan' pe 1 request/day ki limit lagata hai.
3. Midnight par limit wapas 0 (reset) karta hai.
========================================================
*/

import { User } from "../models/user.model.js";

export const checkAiLimit = async (req, res, next) => {
    try {
        // req.user.id hume authUser middleware se milta hai
        const user = await User.findById(req.user.id || req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🌟 RULE 1: PREMIUM USERS KA VIP PASS
        // Agar plan premium/admin hai, toh koi check mat karo, seedha aage jaane do
        if (user.plan === "premium" || user.plan === "PRO" || user.role === "admin") {
            return next();
        }

        // 🌟 RULE 2: STRICT FEATURE LOCK (Enhance is PRO exclusively)
        // Agar free user '/enhance' URL hit kar raha hai, toh seedha block karo
        if (req.originalUrl.includes("/enhance")) {
            return res.status(403).json({
                success: false,
                message: "AI Text Enhancer is a Premium exclusive feature. Upgrade to unlock this magic! ✨",
                requiresUpgrade: true
            });
        }

        // 🌟 RULE 3: THE MIDNIGHT RESET (Naya din check karna)
        const today = new Date().toDateString(); 
        const lastUsageDate = user.lastAiUsageDate ? new Date(user.lastAiUsageDate).toDateString() : null;

        // Agar user ka aakhri usage 'aaj' se match nahi karta, matlab din badal gaya hai
        if (today !== lastUsageDate) {
            user.dailyAiUsageCount = 0; // Limit reset
            user.lastAiUsageDate = Date.now(); // Date update
            await user.save(); // Database me save kar do
        }

        // 🌟 RULE 4: THE DAILY AI LIMIT CHECK (For ATS & PDF Upload)
        const FREE_DAILY_LIMIT = 1;

        if (user.dailyAiUsageCount >= FREE_DAILY_LIMIT) {
            // Agar limit puri ho gayi hai, toh 403 (Forbidden) error bhejo
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 1 AI request (ATS/PDF Parse). Please upgrade to Premium.",
                requiresUpgrade: true // Frontend is flag ko dekh kar Premium ka popup dikhayega
            });
        }

        // Agar sab theek hai (limit bachi hai), toh controller ke paas bhej do
        next();

    } catch (error) {
        console.error("Subscription Bouncer Error:", error);
        return res.status(500).json({ message: "Error verifying subscription limits" });
    }
};