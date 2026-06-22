import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    amount: { type: Number, required: true }, // Saved in pure INR (199)
    currency: { type: String, default: "INR" },
    status: { 
        type: String, 
        enum: ["SUCCESS", "FAILED", "REFUNDED"],
        default: "SUCCESS" 
    }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);