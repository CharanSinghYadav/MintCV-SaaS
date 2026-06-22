/*
========================================================
FILE PURPOSE: resume.routes.js
========================================================

Ye file Resume se related saare URLs (routes) define karti hai.
Har route me humne apna bouncer (authUser) lagaya hai,
kyunki koi bhi bina login kiye resume create ya dekh nahi sakta.
========================================================
*/

import express from "express";
import { 
    createResume, 
    getUserResumes, 
    updateResume,
    evaluateResume,
    generateInterviewPrep,
    uploadResumeFile,
    getPublicResume,
    enhanceResumeText,
    deleteResume,
    getMyInterviews,
} from "../controllers/resume.controller.js";
import { checkAiLimit } from "../middlewares/subscription.middleware.js";
import authUser from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const resumeRouter = express.Router();

// ==========================================
// ROUTES DEFINITION
// ==========================================

/**
 * @route   POST /api/resume/create
 * @desc    Naya resume save karna (ya khali draft save karna)
 * @access  Private (Login required)
 */
resumeRouter.post("/create", authUser, createResume);

/**
 * @route   GET /api/resume/my-resumes
 * @desc    Logged-in user ke saare resumes ki list lana
 * @access  Private
 */
resumeRouter.get("/my-resumes", authUser, getUserResumes);

/**
 * @route   GET /api/resume/my-interviews
 * @desc    Get interview questions for Vault
 * @access  Private
 */
resumeRouter.get("/my-interviews", authUser, getMyInterviews);

/**
 * @route   PUT /api/resume/update/:id
 * @desc    Kisi specific resume ko update karna
 * @access  Private
 */
resumeRouter.put("/update/:id", authUser, updateResume);

/**
 * @route   POST /api/resume/upload
 * @desc    Upload PDF, AI Extractor
 */
resumeRouter.post("/upload", authUser, checkAiLimit, upload.single("resumeFile"), uploadResumeFile);

/**
 * @route   GET /api/resume/evaluate/:id
 * @desc    AI ATS Score
 */
resumeRouter.get("/evaluate/:id", authUser, checkAiLimit, evaluateResume);

/**
 * @route   GET /api/resume/interview-prep/:id
 * @desc    AI Interview Questions
 */
resumeRouter.get("/interview-prep/:id", authUser, checkAiLimit, generateInterviewPrep);

/**
 * @route   GET /api/resume/share/:id
 * @desc    Public route to view a resume without login
 * @access  Public
 */
resumeRouter.get("/share/:id", getPublicResume);

/**
 * @route   POST /api/resume/enhance
 * @desc    AI Enhance Text feature for Builder Form
 */
resumeRouter.post("/enhance", authUser, checkAiLimit, enhanceResumeText);

/**
 * @route   DELETE /api/resume/delete/:id
 * @desc    Delete a resume document
 */
resumeRouter.delete("/delete/:id", authUser, deleteResume);


export default resumeRouter;