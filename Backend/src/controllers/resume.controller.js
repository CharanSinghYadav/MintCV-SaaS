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
/*
========================================================
FILE PURPOSE: resume.controller.js (SECURE WIRE-SLICING V2)
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

export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id || req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ message: "Resumes fetched successfully", count: resumes.length, resumes });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching resumes", error: error.message });
  }
};

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

export const evaluateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user.id || req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found or unauthorized" });

    const evaluationResult = await evaluateResumeWithAI(resume.toObject());

    if (evaluationResult?.atsScore) {
      await Resume.findByIdAndUpdate(id, { lastAtsScore: evaluationResult.atsScore });
    }
    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({ message: "Resume evaluated successfully", evaluation: evaluationResult });
  } catch (error) {
    console.error("Controller Execution Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Please try again in a moment!",
        isAiOverloaded: true
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error occurred." });
  }
};

// ============================================================================
// 🤖 INTERVIEW PREP (THE BULLETPROOF SERVER-SIDE WIRE SLICER)
// ============================================================================
export const generateInterviewPrep = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });

    // 1. Check strict subscription status
    const isPremiumUser = req.user?.plan === "premium" || req.user?.plan === "PRO" || req.user?.role === "admin";

    let masterPrepData = null;

    // GATEWAY 1: Check Master Cache in DB
    if (resume.interviewPrepCache?.questionsList?.length > 0) {
      console.log("⚡ Serving Interview Master Cache from MongoDB!");
      masterPrepData = resume.interviewPrepCache;
    } else {
      // GATEWAY 2: Generate Fresh 10 Questions via AI (ALWAYS build 10 for the DB cache!)
      console.log("🤖 Generating fresh 10 Master Questions for DB storage...");
      // Pass 'true' to AI service to force generating 10 hard scenario questions
      const aiGeneratedPrep = await generateInterviewQuestionsWithAI(resume.toObject(), true); 
      
      await Resume.findByIdAndUpdate(id, { interviewPrepCache: aiGeneratedPrep });
      masterPrepData = aiGeneratedPrep;
      await tickUserAiMeter(req.user.id || req.user._id);
    }

    // 🔥 THE MASTERMIND WIRE-SLICE (Server-Side Paywalling)
    // Agar user Free hai, toh network wire pe sirf 3 question bhejo, baki 7 RAM me hi drop maar do!
    const responsePrepPayload = {
      role: masterPrepData.role || "Software Engineer",
      questionsList: isPremiumUser 
        ? masterPrepData.questionsList 
        : masterPrepData.questionsList.slice(0, 3) // <-- HACKER SHIELD
    };

    return res.status(200).json({ 
      success: true, 
      isCached: Boolean(resume.interviewPrepCache), 
      isPremiumView: isPremiumUser, 
      totalAvailableQuestions: masterPrepData.questionsList.length,
      prep: responsePrepPayload // <-- Name changed to 'prep'
    });

  } catch (error) {
    console.error("Interview Prep Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({ success: false, message: "AI Server is taking a breathing break 🧘‍♂️. Hold tight!" });
    }
    return res.status(500).json({ success: false, message: "Internal server error during interview generation." });
  }
};

export const uploadResumeFile = async (req, res) => {
  let localFilePath = null;
  try {
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF file" });

    localFilePath = req.file.path;
    const fileBuffer = fs.readFileSync(localFilePath);

    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    const extractedText = result.text; 
    await parser.destroy(); 

    const structuredResumeData = await extractResumeDataWithAI(extractedText);
    const cloudinaryResult = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResult) throw new Error("Cloudinary upload failed.");

    await tickUserAiMeter(req.user.id || req.user._id);

    return res.status(200).json({
      message: "File uploaded and parsed successfully",
      fileUrl: cloudinaryResult.secure_url,
      resumeData: structuredResumeData,
    });

  } catch (error) {
    console.error("Upload & Parse Error:", error);
    if (error.statusCode === 429) {
      return res.status(429).json({ success: false, message: "AI Server overloaded.", isAiOverloaded: true });
    }
    return res.status(500).json({ success: false, message: error.message || "Internal server error." });
  } finally {
    if (localFilePath && fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }
  }
};

export const getPublicResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching resume", error: error.message });
  }
};

export const enhanceResumeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5) return res.status(400).json({ message: "Text too short" });

    const enhancedText = await enhanceTextWithAI(text);
    await tickUserAiMeter(req.user.id || req.user._id);
    return res.status(200).json({ message: "Success", enhancedText });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResume = await Resume.findOneAndDelete({ _id: id, user: req.user.id || req.user._id });
    if (!deletedResume) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ success: true, id });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    // 1. Un saare resumes ko dhoondo jinme interviewPrepCache null nahi hai
    const resumes = await Resume.find({
      user: req.user.id || req.user._id,
      interviewPrepCache: { $ne: null }
    }).sort({ updatedAt: -1 }).select('title interviewPrepCache updatedAt');

    const isPremiumUser = req.user?.plan === "premium" || req.user?.plan === "PRO" || req.user?.role === "admin";

    // 2. Wire-slice data for frontend
    const vault = resumes.map(res => {
      const prep = res.interviewPrepCache;
      const allQuestions = prep.questionsList || [];
      return {
        resumeId: res._id,
        title: res.title,
        updatedAt: res.updatedAt,
        role: prep.role || "Software Engineer",
        totalQuestions: allQuestions.length,
        // Free user ko sirf length dikhegi, par network pe actual array sirf 3 item ka aayega!
        previewQuestions: isPremiumUser ? allQuestions : allQuestions.slice(0, 3) 
      };
    });

    return res.status(200).json({ success: true, isPremiumView: isPremiumUser, vault });
  } catch (error) {
    console.error("Fetch Interviews Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching interview vault." });
  }
};