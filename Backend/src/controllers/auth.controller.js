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

// ==========================================
// 1. REGISTER USER
// ==========================================
export const registerUserController = async (req, res) => {
    // A. Frontend se data nikalo
    const { username, email, password } = req.body;

    // B. Validation (Koi field khali toh nahi?)
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide username, email and password" });
    }

    // C. Check karo ki user pehle se toh nahi hai
    const isUserAlreadyExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "Account with this username or email already exists" });
    }

    // D. Naya user create karo 
    // (Magic 🪄: Password hash apne aap ho jayega kyuki humne user.model.js me pre-save hook lagaya hai!)
    const user = await User.create({ username, email, password });

    // E. Token generate karo (Ye method bhi humne Model me banaya tha)
    const token = user.generateToken();

    // F. Cookie set karo aur success response bhejo
    res.cookie("token", token);
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

    // A. User find karo
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    // B. Password check karo (Model ka custom method use karke)
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" }); // Status 400 hi do hacker ko confuse karne ke liye
    }

    // C. Token do aur login karwao
    const token = user.generateToken();
    
    res.cookie("token", token);
    return res.status(200).json({
        message: "User Logged In Successfully",
        user: { id: user._id, username: user.username, email: user.email, plan: user.plan, role: user.role }
    });
};

// ==========================================
// 3. LOGOUT USER
// ==========================================
export const logoutUserController = async (req, res) => {
    // Cookie se token nikalo
    const token = req.cookies?.token;

    // Agar token hai toh usko DB me blacklist kar do
    if (token) {
        await BlacklistToken.create({ token });
    }

    // Browser se cookie hata do
    res.clearCookie("token");
    return res.status(200).json({ message: "User logged out successfully" });
};

// ==========================================
// 4. GET ME (Current User)
// ==========================================
export const getMeController = async (req, res) => {
    // req.user humare auth.middleware se aayega 
    const user = await User.findById(req.user.id);

    return res.status(200).json({
        message: "User details fetched successfully",
        user: { id: user._id, username: user.username, email: user.email, plan: user.plan, role: user.role }
    });
}; 