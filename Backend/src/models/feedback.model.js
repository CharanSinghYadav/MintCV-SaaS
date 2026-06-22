import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["Bug", "Suggestion", "Other"],
            default: "Suggestion"
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["Pending", "Reviewed", "Resolved"],
            default: "Pending" // Admin panel ke liye kaam aayega
        }
    },
    { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);