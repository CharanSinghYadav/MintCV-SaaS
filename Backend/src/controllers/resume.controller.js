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

export const evaluateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findOne({ _id: id, user: req.user.id || req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found or unauthorized" });

    let evaluationResult;

    try {
        evaluationResult = await evaluateResumeWithAI(resume.toObject());
    } catch (aiError) {
        console.warn("⚠️ ATS AI Failed (Likely Unstructured/Non-Standard Resume). Injecting Emergency Scorecard.");
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

    if (evaluationResult?.atsScore) {
      await Resume.findByIdAndUpdate(id, { lastAtsScore: evaluationResult.atsScore });
    }
    
    await tickUserAiMeter(req.user.id || req.user._id, "dailyAtsCount");

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

export const generateInterviewPrep = async (req, res) => {
  try {
    const { id } = req.params;
    const safeUserId = req.user.id || req.user._id;

    const resume = await Resume.findOne({ _id: id, user: safeUserId });

    if (!resume) {
        return res.status(404).json({ 
            success: false, 
            message: "Document missing or you are unauthorized to access this workspace." 
        });
    }

    const liveUser = await User.findById(safeUserId);
    const isPremiumUser = liveUser?.plan === "premium" || liveUser?.plan === "PRO" || liveUser?.role === "admin";
    
    let masterPrepData = null;

    if (resume.interviewPrepCache?.questionsList?.length > 0) {
      console.log("⚡ Serving Interview Master Cache from MongoDB!");
      masterPrepData = resume.interviewPrepCache;
    } else {
      
      if (!isPremiumUser) {
        const today = new Date().toDateString();
        const lastUsageDate = liveUser.lastAiUsageDate ? new Date(liveUser.lastAiUsageDate).toDateString() : null;

        if (today !== lastUsageDate) {
            liveUser.dailyPdfCount = 0;
            liveUser.dailyAtsCount = 0;
            liveUser.dailyMockCount = 0;
            liveUser.lastAiUsageDate = Date.now();
            await liveUser.save();
        }

        if (liveUser.dailyMockCount >= 3) {
            return res.status(403).json({
                success: false,
                message: "You have reached your daily limit of 3 AI Mock Generations. Please upgrade to Premium.",
                requiresUpgrade: true 
            });
        }
      }

      console.log("🤖 Cache Missed. Requesting AI...");
      
      try {
          masterPrepData = await generateInterviewQuestionsWithAI(resume.toObject(), true);
      } catch (aiError) {
          console.warn("⚠️ AI Generation Failed. Injecting Universal Fallback Set.");
          masterPrepData = {
              role: "Professional Candidate",
              questionsList: [
                  { id: 1, difficulty: "Easy", question: "Walk me through your resume and highlight your most significant professional achievement.", expectedAnswer: "Focus on impact, structure your answer using the STAR method." },
                  { id: 2, difficulty: "Medium", question: "Describe a time you faced a significant challenge in a project. How did you handle it?", expectedAnswer: "Discuss your problem-solving approach and collaboration." },
                  { id: 3, difficulty: "Medium", question: "How do you prioritize tasks when you have multiple tight deadlines?", expectedAnswer: "Mention tools/frameworks you use (Eisenhower Matrix, Agile)." },
                  { id: 4, difficulty: "Hard", question: "Tell me about a time you had a conflict with a team member or manager.", expectedAnswer: "Focus on professional resolution and active listening." },
                  { id: 5, difficulty: "Medium", question: "Where do you see your career progressing in the next 3 to 5 years?", expectedAnswer: "Show ambition but keep it realistic." },
                  { id: 6, difficulty: "Easy", question: "What is your preferred working style (independent vs team-based)?", expectedAnswer: "Highlight flexibility." },
                  { id: 7, difficulty: "Hard", question: "Describe a time you had to learn a completely new skill or tool very quickly.", expectedAnswer: "Show adaptability and your learning methodology." },
                  { id: 8, difficulty: "Medium", question: "How do you handle constructive criticism?", expectedAnswer: "Acknowledge it as a growth opportunity." },
                  { id: 9, difficulty: "Medium", question: "What motivates you to perform at your best?", expectedAnswer: "Align personal motivation with solving problems." },
                  { id: 10, difficulty: "Easy", question: "Why should we hire you over other qualified candidates?", expectedAnswer: "Summarize your unique mix of hard and soft skills." }
              ]
          };
      }
      
      await Resume.findOneAndUpdate(
         { _id: id, user: safeUserId }, 
         { interviewPrepCache: masterPrepData }
      );

      await tickUserAiMeter(liveUser._id, "dailyMockCount");
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

// ============================================================================
// 📁 GET MY INTERVIEWS VAULT (WITH ABSOLUTE DB OVERRIDE)
// ============================================================================
export const getMyInterviews = async (req, res) => {
  try {
    const safeUserId = req.user.id || req.user._id;
    
    // 🌟 FIX: Never trust the cookie for Vault decryption. Query MongoDB directly!
    const liveUser = await User.findById(safeUserId); 
    const isPremiumUser = liveUser?.plan === "premium" || liveUser?.plan === "PRO" || liveUser?.role === "admin";

    const resumes = await Resume.find({
      user: safeUserId,
      interviewPrepCache: { $ne: null }
    }).sort({ updatedAt: -1 }).select('title interviewPrepCache updatedAt');

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