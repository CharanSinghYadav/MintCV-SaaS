/*
========================================================
FILE PURPOSE: subscription.middleware.js
========================================================
Ye middleware "Route-Aware" Bouncer hai.
1. 'Enhance' API ko completely lock karta hai free users ke liye.
2. Check granular limits based on requested feature (/upload or /evaluate).
3. Midnight par limits wapas 0 (reset) karta hai.
========================================================
*/

import { User } from "../models/user.model.js";

export const checkAiLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id || req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🌟 RULE 1: VIP PASS
        if (user.plan === "premium" || user.plan === "PRO" || user.role === "admin") {
            return next();
        }

        // 🌟 RULE 2: STRICT FEATURE LOCK
        if (req.originalUrl.includes("/enhance")) {
            return res.status(403).json({
                success: false,
                message: "AI Text Enhancer is a Premium exclusive feature. Upgrade to unlock this magic! ✨",
                requiresUpgrade: true
            });
        }

        // 🌟 RULE 3: MIDNIGHT RESET
        const today = new Date().toDateString(); 
        const lastUsageDate = user.lastAiUsageDate ? new Date(user.lastAiUsageDate).toDateString() : null;

        if (today !== lastUsageDate) {
            user.dailyPdfCount = 0; 
            user.dailyAtsCount = 0;
            user.dailyMockCount = 0;
            user.lastAiUsageDate = Date.now(); 
            await user.save(); 
        }

        // 🌟 RULE 4: ROUTE-AWARE GRANULAR LIMITS
        if (req.originalUrl.includes("/upload") && user.dailyPdfCount >= 1) {
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 1 PDF Parse. Please upgrade to Premium.",
                requiresUpgrade: true 
            });
        }

        if (req.originalUrl.includes("/evaluate") && user.dailyAtsCount >= 1) {
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 1 ATS Scan. Please upgrade to Premium.",
                requiresUpgrade: true 
            });
        }

        next();

    } catch (error) {
        console.error("Subscription Bouncer Error:", error);
        return res.status(500).json({ message: "Error verifying subscription limits" });
    }
};