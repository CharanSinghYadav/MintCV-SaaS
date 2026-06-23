import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { Payment } from "../models/payment.model.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const cookieOptions = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
};

// =================================================================
// 1. CREATE ORDER
// =================================================================
export const createPremiumOrder = async (req, res) => {
    try {
        const PREMIUM_PRICE = 199; 

        const safeUserId = String(req.user?.id || req.user?._id || "unknown");

        const options = {
            amount: PREMIUM_PRICE * 100,
            currency: "INR",
            receipt: `mintcv_receipt_${safeUserId.slice(-6)}`,
        };

        const order = await razorpay.orders.create(options);

        const user = await User.findById(safeUserId);
        if (!user) {
            return res.status(404).json({ message: "User not found for payment processing." });
        }

        user.razorpayOrderId = order.id;
        await user.save();

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return res.status(500).json({ message: "Failed to connect with Payment Gateway" });
    }
};

// =================================================================
// 2. VERIFY PAYMENT (WITH CROSS-ORIGIN SECURE COOKIE OVERWRITE)
// =================================================================
export const verifyPremiumPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ success: false, message: "Payment Verification Failed! Nakli Transaction." });
        }

        const safeUserId = String(req.user?.id || req.user?._id);
        const user = await User.findById(safeUserId);
        
        // Ensure standard casing in DB
        user.plan = "premium";
        user.razorpayPaymentId = razorpay_payment_id;
        await user.save();

        await Payment.create({
            user: user._id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: 199,
            status: "SUCCESS"
        });

        const newToken = user.generateToken();
        
        // 🌟 FIX: Injecting the strict cross-origin cookieOptions!
        res.cookie("token", newToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Payment Successful! You are now a MintCV Premium user. 👑",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(500).json({ message: "Payment verified but server failed to update profile." });
    }
};