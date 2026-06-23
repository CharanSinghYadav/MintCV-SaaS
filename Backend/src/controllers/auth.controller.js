/*
========================================================
FILE PURPOSE: auth.controller.js
========================================================

Ye file Authentication ka actual brain/logic hai.
Route check karega ki kaunsa URL hit hua hai, aur Controller 
decide karega ki us URL pe aane ke baad kya kaam karna hai.

Functions:
1. Register: Naya user DB me daalna.
2. Login: Email/Password check karna aur Token dena.
3. Logout: Token ko blacklist karna aur cookie clear karna.
4. GetMe: Logged-in user ki details dena.
========================================================
*/

import { User } from "../models/user.model.js";
import { BlacklistToken } from "../models/blacklist.model.js";

// 🌟 BRAHMASTRA COOKIE OPTIONS (Ye auto-detect karega ki tu Local pe hai ya Vercel pe)
const cookieOptions = {
    httpOnly: true, // XSS attacks se bachane ke liye (JS isko read nahi kar sakti)
    secure: process.env.NODE_ENV === "production", // Render (Production) pe true, Localhost pe false
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Vercel-to-Render ke liye 'none' MUST hai
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days tak user login rahega
};

// ==========================================
// 1. REGISTER USER
// ==========================================
export const registerUserController = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide username, email and password" });
    }

    const isUserAlreadyExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "Account with this username or email already exists" });
    }

    const user = await User.create({ username, email, password });
    const token = user.generateToken();

    // 🔥 FIX 1: Yahan cookieOptions pass kiya
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
        message: "User Registered Successfully",
        user: { id: user._id, username: user.username, email: user.email, plan: user.plan, role: user.role }
    });
};

// ==========================================
// 2. LOGIN USER
// ==========================================
export const loginUserController = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateToken();
    
    // 🔥 FIX 2: Yahan cookieOptions pass kiya
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
        message: "User Logged In Successfully",
        user: { id: user._id, username: user.username, email: user.email, plan: user.plan, role: user.role }
    });
};

// ==========================================
// 3. LOGOUT USER
// ==========================================
export const logoutUserController = async (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        await BlacklistToken.create({ token });
    }

    // 🔥 FIX 3: Logout me bhi same cookie options dena padta hai, warna browser delete nahi karta!
    res.clearCookie("token", cookieOptions);
    return res.status(200).json({ message: "User logged out successfully" });
};

// ==========================================
// 4. GET ME (Current User)
// ==========================================
export const getMeController = async (req, res) => {
    try {
        // 🌟 FIX: _id vs id safe check to prevent 500 crashes
        const userId = req.user.id || req.user._id;
        
        if (!userId) {
             return res.status(401).json({ message: "Unauthorized Request: User ID missing in token" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found in database" });
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: { id: user._id, username: user.username, email: user.email, plan: user.plan, role: user.role }
        });
    } catch (error) {
        console.error("GetMe Error:", error);
        return res.status(500).json({ message: "Internal server error during authentication check" });
    }
};