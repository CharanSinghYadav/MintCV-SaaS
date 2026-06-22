import { Feedback } from "../models/feedback.model.js";

export const submitFeedback = async (req, res) => {
    try {
        const { type, message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: "Feedback message cannot be empty." });
        }

        const newFeedback = await Feedback.create({
            user: req.user.id, // Auth middleware se aayega
            type: type || "Suggestion",
            message
        });

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully. Thank you!",
            feedback: newFeedback
        });
    } catch (error) {
        return res.status(500).json({ message: "Error submitting feedback", error: error.message });
    }
};