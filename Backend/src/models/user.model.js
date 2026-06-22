/*
========================================================
FILE PURPOSE: user.model.js
========================================================

Ye file User ka database structure (Schema) define karti hai.
(Updated with Razorpay Ledger details)
========================================================
*/

import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            unique: [true, "Username already taken"],
            required: true,
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            unique: [true, "Account with this email already exists"],
            required: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },

        // ==========================================
        // 🌟 SAAS & ADMIN FIELDS
        // ==========================================
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        plan: {
            type: String,
            enum: ["free", "premium"],
            default: "free"
        },
        dailyAiUsageCount: {
            type: Number,
            default: 0
        },
        lastAiUsageDate: {
            type: Date,
            default: Date.now
        },
        isBlocked: {
            type: Boolean,
            default: false 
        },
        lifetimeAiUsage: {
            type: Number,
            default: 0 
        },

        // ==========================================
        // 💸 PAYMENT LEDGER (Razorpay Tracking)
        // ==========================================
        razorpayOrderId: {
            type: String,
            default: null // Jab user pay pe click karega tab ye generate hoga
        },
        razorpayPaymentId: {
            type: String,
            default: null // Jab bank account se paise kat jayenge tab ye save hoga
        }
    },
    { timestamps: true } 
);

/*
========================================================
MONGOOSE PRE-SAVE HOOK (Password Hashing)
========================================================
*/
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

/*
========================================================
CUSTOM METHODS
========================================================
*/
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Access Token generate karne ka method
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            id: this._id,
            username: this.username,
            role: this.role,
            plan: this.plan
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

export const User = mongoose.model("User", userSchema);