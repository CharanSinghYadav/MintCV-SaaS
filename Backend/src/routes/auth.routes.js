/*
========================================================
FILE PURPOSE: auth.routes.js
========================================================

Ye file ek 'Map' ya 'Directory' ki tarah hai.
Jab bhi frontend se koi request aati hai, ye file decide karti hai ki:
"Is URL ke liye kaunsa controller aur middleware chalana hai?"
========================================================
*/

import express from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
} from "../controllers/auth.controller.js";
import authUser from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

/**
 * @route   POST /api/auth/register 
 * @desc    Register a new user
 * @access  Public (Koi bouncer nahi hai)
 */ 
authRouter.post("/register", registerUserController);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
authRouter.post("/login", loginUserController);

/**
 * @route   GET /api/auth/logout
 * @desc    Clear token and add to blacklist
 * @access  Public
 */
authRouter.get("/logout", logoutUserController);

/**
 * @route   GET /api/auth/get-me
 * @desc    Get the current logged-in user details
 * @access  Private (Pehle authUser middleware chalega, fir controller)
 */
authRouter.get("/get-me", authUser, getMeController);

export default authRouter;