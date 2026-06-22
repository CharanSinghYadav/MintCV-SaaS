/*
========================================================
FILE PURPOSE: resume.controller.js
========================================================
Ye file Resume ke saare kaam (CRUD, AI, aur File Upload) handle karti hai.
Ye file Resume ke saare CRUD operations handle karti hai.
C - Create (Naya resume banana)
R - Read (Apne resumes dekhna)
U - Update (Resume me changes karna)
D - Delete (Resume delete karna)
========================================================
*/

import { Resume } from "../models/resume.model.js";
import { User } from "../models/user.model.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { PDFParse } from "pdf-parse";
import {
  evaluateResumeWithAI,
  generateInterviewQuestionsWithAI,
  extractResumeDataWithAI,
  enhanceTextWithAI,
} from "../services/ai.services.js";

// ============================================================================
// 💡 PRIVATE HELPER: 1 single function to tick ALL user AI meters atomically!
// ============================================================================
const tickUserAiMeter = async (userId) => {
  if (!userId) return;
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { dailyAiUsageCount: 1, lifetimeAiUsage: 1 },
      $set: { lastAiUsageDate: Date.now() }
    });
  } catch (err) {
    console.error("⚠️ Failed to tick User AI Meter:", err.message);
  }
};


// ==========================================
// 1. CREATE RESUME
// ==========================================
export const createResume = async (req, res) => {
  try {
    const resumeData = req.body;
    if (!resumeData.title) {
      return res.status(400).json({ message: "Resume title is required" });
    }

    const newResume = await Resume.create({
      ...resumeData,
      user: req.user.id || req.user._id,
    });

    return res.status(201).json({ message: "Resume created successfully", resume: newResume });
  } catch (error) {
    return res.status(500).json({ message: "Error creating resume", error: error.message });
  }
};

// ==========================================
// 2. GET USER RESUMES
// ==========================================
export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id || req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ message: "Resumes fetched successfully", count: resumes.length, resumes });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching resumes", error: error.message });
  }
};

// ==========================================
// 3. UPDATE RESUME
// ==========================================
export const updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const resume = await Resume.findOne({ _id: id, user: req.user.id || req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found or unauthorized" });
    }

    const updatedResume = await Resume.findByIdAndUpdate(id, updateData, { new: true });
    return res.status(200).json({ message: "Resume updated successfully", resume: updatedResume });
  } catch (error) {
    return res.status(500).json({ message: "Error updating resume", error: error.message });
  }
};

// ==========================================
// 4. EVALUATE RESUME (ATS Score)
// ==========================================
export const evaluateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user.id || req.user._id });

    if (!resume) return res.status(404).json({ message: "Resume not found or unauthorized" });

    const evaluationResult = await evaluateResumeWithAI(resume.toObject());

    // 🌟 FIX 1: Safe Atomic Update (Bypassing Mongoose Validation traps)
    if (evaluationResult?.atsScore) {
      await Resume.findByIdAndUpdate(id, { lastAtsScore: evaluationResult.atsScore });
    }

    // 🌟 FIX 2: Single Atomic Meter Tick
    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({ message: "Resume evaluated successfully", evaluation: evaluationResult });

  } catch (error) {
    console.error("Controller Execution Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Please try again in a moment!",
        isAiOverloaded: true,
        requiresUpgrade: false 
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error occurred." });
  }
};

// ==========================================
// 5. INTERVIEW PREP (With Read-Through Cache)
// ==========================================
export const generateInterviewPrep = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });

    const isPremiumUser = req.user?.subscriptionPlan === "premium" || req.user?.isPremium === true || req.user?.plan === "premium";

    // GATEWAY 1: Serve from DB Cache
    if (resume.interviewPrepCache?.questionsList?.length > 0) {
      console.log("⚡ Serving Interview Questions from MongoDB Cache!");
      return res.status(200).json({ success: true, isCached: true, isPremiumView: isPremiumUser, prep: resume.interviewPrepCache });
    }

    // GATEWAY 2: Generate Fresh via AI
    console.log(`🤖 Generating fresh ${isPremiumUser ? '10 (Paid)' : '3 (Free)'} Questions...`);
    const aiGeneratedPrep = await generateInterviewQuestionsWithAI(resume.toObject(), isPremiumUser);

    await Resume.findByIdAndUpdate(id, { interviewPrepCache: aiGeneratedPrep });
    
    // 🌟 FIX 3: Tick meter for interview generation too!
    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({ success: true, isCached: false, isPremiumView: isPremiumUser, prep: aiGeneratedPrep });

  } catch (error) {
    console.error("Interview Prep Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({ success: false, message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Hold tight!" });
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ==========================================
// 6. UPLOAD & PARSE RESUME PDF
// ==========================================
export const uploadResumeFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF file" });

    const localFilePath = req.file.path;
    const fileBuffer = fs.readFileSync(localFilePath);

    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    const extractedText = result.text; 
    await parser.destroy(); 

    const structuredResumeData = await extractResumeDataWithAI(extractedText);
    const cloudinaryResult = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResult) {
      return res.status(500).json({ message: "Error uploading file to cloud storage" });
    }

    // 🌟 Single Atomic Meter Tick
    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({
      message: "File uploaded and parsed successfully",
      fileUrl: cloudinaryResult.secure_url,
      resumeData: structuredResumeData,
    });

  } catch (error) {
    console.error("Upload & Parse Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Please try again in a moment!",
        isAiOverloaded: true,
        requiresUpgrade: false
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error occurred." });
  }
};

// ==========================================
// 7. GET PUBLIC RESUME
// ==========================================
export const getPublicResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: "Resume not found or link is invalid" });

    return res.status(200).json({ success: true, resume });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching public resume", error: error.message });
  }
};

// ==========================================
// 8. ENHANCE RESUME TEXT
// ==========================================
export const enhanceResumeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5) return res.status(400).json({ message: "Text is too short to enhance" });

    const enhancedText = await enhanceTextWithAI(text);

    // 🌟 Single Atomic Meter Tick
    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({ message: "Text enhanced successfully", enhancedText });

  } catch (error) {
    console.error("Enhance Text Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Please try again in a moment!",
        isAiOverloaded: true,
        requiresUpgrade: false 
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error occurred." });
  }
};

// ==========================================
// 9. DELETE RESUME
// ==========================================
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResume = await Resume.findOneAndDelete({ _id: id, user: req.user.id || req.user._id });

    if (!deletedResume) return res.status(404).json({ message: "Resume not found or unauthorized to delete." });

    return res.status(200).json({ success: true, message: "Resume successfully moved to trash.", id });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting resume", error: error.message });
  }
};