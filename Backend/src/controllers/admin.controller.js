/*
========================================================
FILE PURPOSE: admin.controller.js
Admin Panel ka sara logic yahan hai. (Ambani Revenue Audit Applied)
========================================================
*/

import { User } from "../models/user.model.js";
import { Resume } from "../models/resume.model.js"; 
import { Feedback } from "../models/feedback.model.js"; 
import { Payment } from "../models/payment.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied. Admins only." });

        const totalUsers = await User.countDocuments();
        const premiumUsers = await User.countDocuments({ plan: "premium" });
        const freeUsers = totalUsers - premiumUsers;

       
        const revenueAggregation = await Payment.aggregate([
            { $match: { status: "SUCCESS" } },
            { $group: { _id: null, totalCash: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAggregation[0]?.totalCash || 0;

        const totalResumes = await Resume.countDocuments();

        const aiStats = await User.aggregate([{ $group: { _id: null, totalAiHits: { $sum: "$lifetimeAiUsage" } } }]);
        const totalAiHits = aiStats.length > 0 ? aiStats[0].totalAiHits : 0;

        return res.status(200).json({
            success: true,
            stats: { totalUsers, premiumUsers, freeUsers, totalRevenue, totalResumes, totalAiHits }
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching stats", error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied." });

        const users = await User.find().select("-password").sort({ createdAt: -1 }); 
        
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching users" });
    }
};

export const manageUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied." });

        const { userId, action } = req.body; // action can be: 'upgrade', 'downgrade', 'block', 'unblock'
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        switch (action) {
            case "upgrade": user.plan = "premium"; break;
            case "downgrade": user.plan = "free"; break;
            case "block": user.isBlocked = true; break;
            case "unblock": user.isBlocked = false; break;
            default: return res.status(400).json({ message: "Invalid action" });
        }

        await user.save();
        return res.status(200).json({ success: true, message: `User successfully ${action}ed!`, user });
    } catch (error) {
        return res.status(500).json({ message: "Error updating user" });
    }
};

export const getAllFeedbacks = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied." });

        const feedbacks = await Feedback.find()
            .populate("user", "username email") 
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching feedbacks" });
    }
};