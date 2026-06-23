/*
========================================================
FILE PURPOSE: resume.controller.js (SECURE WIRE-SLICING V2 & INLINE BOUNCER)
========================================================
Ye file Resume ke saare CRUD operations, File Upload, 
aur AI feature triggers handle karti hai.
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

// 🌟 FIX: Dynamic ticker accepts the specific field to increment
const tickUserAiMeter = async (userId, fieldToIncrement) => {
  if (!userId || !fieldToIncrement) return;
  try {
    const incQuery = { lifetimeAiUsage: 1 };
    incQuery[fieldToIncrement] = 1;

    await User.findByIdAndUpdate(userId, {
      $inc: incQuery,
      $set: { lastAiUsageDate: Date.now() }
    });
  } catch (err) {
    console.error(`⚠️ Failed to tick User AI Meter [${fieldToIncrement}]:`, err.message);
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

// ============================================
// 📊 EVALUATE RESUME 
// ============================================
export const evaluateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user.id || req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found or unauthorized" });

    let evaluationResult;

    // 🌟 FIX: THE AI FALLBACK SHIELD FOR ATS
    try {
        // Step 1: AI Try karega dynamically evaluate karna
        evaluationResult = await evaluateResumeWithAI(resume.toObject());
    } catch (aiError) {
        console.warn("⚠️ ATS AI Failed (Likely Unstructured/Non-Standard Resume). Injecting Emergency Scorecard.");
        
        // Step 2: Universal Emergency Fallback ATS Scorecard
        evaluationResult = {
            atsScore: 35,
            feedback: "We couldn't fully analyze the structure of this document. It might lack standard headings, quantifiable metrics, or industry-specific keywords.",
            missingKeywords: ["Clear Formatting", "Action Verbs", "Quantifiable Metrics", "Industry-Specific Hard Skills"],
            suggestions: [
                "Use a standard, single-column layout.",
                "Add more descriptive bullet points starting with action verbs.",
                "Ensure your PDF has selectable text, not just images."
            ]
        };
    }

    // Step 3: Result save karo
    if (evaluationResult?.atsScore) {
      await Resume.findByIdAndUpdate(id, { lastAtsScore: evaluationResult.atsScore });
    }
    
    // 🌟 FIX: Granular Tick
    await tickUserAiMeter(req.user.id || req.user._id, "dailyAtsCount");

    return res.status(200).json({ message: "Resume evaluated successfully", evaluation: evaluationResult });
    
  } catch (error) {
    console.error("Controller Execution Error:", error);
    
    // API limit exhaustion catch
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "AI Server is taking a quick 60-second breathing break 🧘‍♂️. Please try again in a moment!",
        isAiOverloaded: true
      });
    }
    
    // Hard crash fallback
    return res.status(500).json({ success: false, message: error.message || "Internal server error occurred." });
  }
};

// ============================================================================
// 🤖 INTERVIEW PREP (WITH UNIVERSAL AI FALLBACK SHIELD)
// ============================================================================
export const generateInterviewPrep = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });

    const isPremiumUser = req.user?.plan === "premium" || req.user?.plan === "PRO" || req.user?.role === "admin";
    let masterPrepData = null;

    if (resume.interviewPrepCache?.questionsList?.length > 0) {
      console.log("⚡ Serving Interview Master Cache from MongoDB!");
      masterPrepData = resume.interviewPrepCache;
    } else {
      
      if (!isPremiumUser) {
        const userCheck = await User.findById(req.user.id || req.user._id);
        const today = new Date().toDateString();
        const lastUsageDate = userCheck.lastAiUsageDate ? new Date(userCheck.lastAiUsageDate).toDateString() : null;

        if (today !== lastUsageDate) {
            userCheck.dailyPdfCount = 0;
            userCheck.dailyAtsCount = 0;
            userCheck.dailyMockCount = 0;
            userCheck.lastAiUsageDate = Date.now();
            await userCheck.save();
        }

        if (userCheck.dailyMockCount >= 3) {
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 3 AI Mock Generations. Please upgrade to Premium.",
                requiresUpgrade: true 
            });
        }
      }

      console.log("🤖 Cache Missed. Requesting AI...");
      
      // 🌟 FIX: THE AI FALLBACK SHIELD
      try {
          masterPrepData = await generateInterviewQuestionsWithAI(resume.toObject(), true);
      } catch (aiError) {
          console.warn("⚠️ AI Generation Failed (Likely Empty/Non-Tech Resume). Injecting Universal Fallback Set.");
          
          // Universal Fallback Set (10 Questions Total)
          masterPrepData = {
              role: "Professional Candidate",
              questionsList: [
                  { id: 1, difficulty: "Easy", question: "Walk me through your resume and highlight your most significant professional achievement.", expectedAnswer: "Focus on impact, structure your answer using the STAR method, and tie your achievement back to the role." },
                  { id: 2, difficulty: "Medium", question: "Describe a time you faced a significant challenge in a project. How did you handle it?", expectedAnswer: "Discuss your problem-solving approach, collaboration, and what you learned from the failure or roadblock." },
                  { id: 3, difficulty: "Medium", question: "How do you prioritize tasks when you have multiple tight deadlines?", expectedAnswer: "Mention tools/frameworks you use (Eisenhower Matrix, Agile), communication with stakeholders, and adaptability." },
                  { id: 4, difficulty: "Hard", question: "Tell me about a time you had a conflict with a team member or manager.", expectedAnswer: "Focus on professional resolution, active listening, and compromising for the project's benefit." },
                  { id: 5, difficulty: "Medium", question: "Where do you see your career progressing in the next 3 to 5 years?", expectedAnswer: "Show ambition but keep it realistic and aligned with the company's growth path." },
                  { id: 6, difficulty: "Easy", question: "What is your preferred working style (independent vs team-based)?", expectedAnswer: "Highlight flexibility. Emphasize ability to focus deeply alone, but collaborate effectively." },
                  { id: 7, difficulty: "Hard", question: "Describe a time you had to learn a completely new skill or tool very quickly.", expectedAnswer: "Show adaptability, your learning methodology, and the successful outcome." },
                  { id: 8, difficulty: "Medium", question: "How do you handle constructive criticism?", expectedAnswer: "Acknowledge it as a growth opportunity, don't take it personally, and explain how you implement feedback." },
                  { id: 9, difficulty: "Medium", question: "What motivates you to perform at your best?", expectedAnswer: "Align personal motivation with solving problems, helping the team, or company mission." },
                  { id: 10, difficulty: "Easy", question: "Why should we hire you over other qualified candidates?", expectedAnswer: "Summarize your unique mix of hard skills, soft skills, and cultural fit for the specific team." }
              ]
          };
      }
      
      await Resume.findByIdAndUpdate(id, { interviewPrepCache: masterPrepData });
      await tickUserAiMeter(req.user.id || req.user._id, "dailyMockCount");
    }

    const responsePrepPayload = {
      role: masterPrepData.role || "Software Engineer",
      questionsList: isPremiumUser 
        ? masterPrepData.questionsList 
        : masterPrepData.questionsList.slice(0, 3) 
    };

    return res.status(200).json({ 
      success: true, 
      isCached: Boolean(resume.interviewPrepCache), 
      isPremiumView: isPremiumUser, 
      totalAvailableQuestions: masterPrepData.questionsList.length,
      prep: responsePrepPayload 
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

    // 🌟 FIX: Granular Tick
    await tickUserAiMeter(req.user.id || req.user._id, "dailyPdfCount");

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
    // Lifetime only, as feature is already premium locked
    await tickUserAiMeter(req.user.id || req.user._id, "lifetimeAiUsage"); 
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
    const resumes = await Resume.find({
      user: req.user.id || req.user._id,
      interviewPrepCache: { $ne: null }
    }).sort({ updatedAt: -1 }).select('title interviewPrepCache updatedAt');

    const isPremiumUser = req.user?.plan === "premium" || req.user?.plan === "PRO" || req.user?.role === "admin";

    const vault = resumes.map(res => {
      const prep = res.interviewPrepCache;
      const allQuestions = prep.questionsList || [];
      return {
        resumeId: res._id,
        title: res.title,
        updatedAt: res.updatedAt,
        role: prep.role || "Software Engineer",
        totalQuestions: allQuestions.length,
        previewQuestions: isPremiumUser ? allQuestions : allQuestions.slice(0, 3) 
      };
    });

    return res.status(200).json({ success: true, isPremiumView: isPremiumUser, vault });
  } catch (error) {
    console.error("Fetch Interviews Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching interview vault." });
  }
};