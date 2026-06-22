/*
========================================================
FILE PURPOSE: subscription.middleware.js
========================================================
Ye middleware check karega ki user free plan par hai ya premium.
Agar free par hai, toh kya usne aaj ki apni AI limit cross kar li hai?
Agar naya din ho gaya hai, toh limit wapas 0 (reset) kar dega.
========================================================
*/

import { User } from "../models/user.model.js";

export const checkAiLimit = async (req, res, next) => {
    try {
        // req.user.id hume authUser middleware se milta hai
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 🌟 RULE 1: PREMIUM USERS KA VIP PASS
        // Agar plan premium hai, toh koi check mat karo, seedha aage jaane do
        if (user.plan === "premium") {
            return next();
        }

        // 🌟 RULE 2: THE MIDNIGHT RESET (Naya din check karna)
        // JavaScript ka `toDateString()` time hata kar sirf date deta hai (e.g., "Wed Jun 17 2026")
        const today = new Date().toDateString(); 
        const lastUsageDate = new Date(user.lastAiUsageDate).toDateString();

        // Agar user ka aakhri usage 'aaj' se match nahi karta, matlab din badal gaya hai
        if (today !== lastUsageDate) {
            user.dailyAiUsageCount = 0; // Limit reset
            user.lastAiUsageDate = Date.now(); // Date update
            await user.save(); // Database me save kar do
        }

        // 🌟 RULE 3: THE LIMIT CHECK
        const FREE_DAILY_LIMIT = 1;

        if (user.dailyAiUsageCount >= FREE_DAILY_LIMIT) {
            // Agar limit puri ho gayi hai, toh 403 (Forbidden) error bhejo
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 1 AI request. Please upgrade to Premium.",
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