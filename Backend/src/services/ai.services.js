/*
========================================================
FILE PURPOSE: ai.services.js (PRODUCTION GRADE V2)
========================================================
*/

import { GoogleGenAI, Type } from "@google/genai";

const executeWithRetry = async (aiFunction, maxRetries = 3, baseDelay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await aiFunction();
        } catch (error) {
            console.log(`⚠️ AI Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt === maxRetries) {
                console.error("❌ Max retries reached. AI API is completely exhausted.");
                const errorDump = (error.message || "") + JSON.stringify(error);
                if (errorDump.includes("429") || errorDump.includes("RESOURCE_EXHAUSTED") || errorDump.includes("Quota exceeded")) {
                    const customErr = new Error("Google AI burst rate limit hit.");
                    customErr.statusCode = 429; 
                    throw customErr;
                }
                throw error;
            }
            const waitTime = baseDelay * attempt;
            console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }
};

const cleanAndParseAiJson = (rawString) => {
    if (!rawString) throw new Error("AI returned an empty string response.");
    try {
        const stripped = rawString
            .replace(/^```json\s*/i, "") 
            .replace(/^```\s*/, "")     
            .replace(/\s*```$/, "")     
            .trim();
        return JSON.parse(stripped);
    } catch (err) {
        console.error("🚨 CRITICAL JSON PARSE FAILURE. Raw String was:", rawString);
        throw new Error("AI hallucinated malformed JSON output that could not be parsed.");
    }
};

const resumeEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        atsScore: { type: Type.INTEGER, description: "ATS matching score out of 100 based on the rubric" },
        feedback: { type: Type.STRING, description: "2-3 line general feedback about the resume" },
        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["atsScore", "feedback", "missingKeywords", "suggestions"]
};

const extractedResumeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        professionalTitle: { type: Type.STRING },
        summary: { type: Type.STRING }, 
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                fullName: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                portfolioUrl: { type: Type.STRING },
                githubUrl: { type: Type.STRING },
                linkedinUrl: { type: Type.STRING },
                location: { type: Type.STRING }
            }
        },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    position: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    description: { type: Type.STRING } 
                }
            }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    techStack: { type: Type.STRING },
                    link: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING },
                    link: { type: Type.STRING }
                }
            }
        },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        languages: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "personalInfo", "summary", "experience", "education", "projects", "certifications", "skills"]
};

export const extractResumeDataWithAI = async (rawPdfText) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        const promptText = `
        You are an elite Data Extraction AI. 
        Read the unstructured resume text and convert it strictly into the provided JSON schema.
        
        CRITICAL RULES FOR CERTIFICATIONS:
        1. Separate Course Name and Issuing Platform.
        2. Never merge the issuer into the title string.

        Raw Resume Text:
        ${rawPdfText}
        `;

        const response = await executeWithRetry(async () => {
            return await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: extractedResumeSchema,
                    temperature: 0.2,
                }
            });
        });

        return cleanAndParseAiJson(response.text);
    } catch (error) {
        console.error("AI Extraction Error: ", error.message);
        if (error.statusCode === 429) throw error;
        throw new Error("Failed to extract data from PDF.");
    }
};

// ============================================================================
// 📊 ATS EVALUATOR (MATHEMATICAL 100-POINT GAMIFIED RUBRIC)
// ============================================================================
export const evaluateResumeWithAI = async (resumeData) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        
        // Dynamic Role Extraction
        const userRole = resumeData.professionalTitle || "Professional";

        // 🌟 FIX: User's exact 100-Point distribution injected with Field-Agnostic logic
        const promptText = `
        You are an elite HR and ATS scoring engine evaluating a resume strictly for the target role of "${userRole}".
        
        CALCULATE THE ATS SCORE STRICTLY USING THIS EXACT 100-POINT MATHEMATICAL SYSTEM:
        
        1. Skills Section (Max 20 Points):
           - Award 20/20 if strong, highly relevant hard skills/tools for a "${userRole}" are clearly listed.
           - Deduct points heavily if this section is empty or filled with vague fluff.

        2. Projects OR Work Experience Section (Max 25 Points):
           - Award 25/25 if detailed descriptions of past jobs, internships, OR personal projects are present.
           - Award maximum points if bullet points contain quantifiable results (e.g., numbers, % growth). 

        3. Education Section (Max 15 Points):
           - Award 15/15 if Institution Name, Degree, and passing timeline/grades are clearly stated.

        4. Formatting & Parsability (Max 15 Points):
           - Award 15/15 if the document structure is clean, standard section headers exist, and contact details (Email, Phone) are valid.

        5. Keywords Relevance (Max 25 Points):
           - Award 25/25 based on keyword density. How strongly do the candidate's extracted words match the high-value industry standard keywords for a "${userRole}"?

        CRITICAL OUTPUT RULE:
        In your 'feedback' string and 'suggestions' array, explicitly guide the candidate on which specific bucket lost them points (e.g., "Your score dropped because your Projects section lacks quantifiable numbers").

        Resume Data:
        ${JSON.stringify(resumeData)}
        `;

        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: resumeEvaluationSchema,
                    temperature: 0.1, // 🌟 Very low temp so AI strictly sticks to the math
                }
            });
            return cleanAndParseAiJson(response.text);
        });

    } catch (error) {
        console.error("AI Evaluation Error: ", error.message);
        if (error.statusCode === 429) throw error;
        throw new Error("Failed to evaluate resume through AI.");
    }
};

const interviewQuestionsSchema = {
    type: Type.OBJECT,
    properties: {
        role: { type: Type.STRING },
        questionsList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                },
                required: ["id", "question", "expectedAnswer", "difficulty"]
            }
        }
    },
    required: ["role", "questionsList"]
};

// ============================================================================
// 🤖 THE DYNAMIC INTERVIEW PROMPT (UNIVERSAL FOR ALL FIELDS)
// ============================================================================
export const generateInterviewQuestionsWithAI = async (resumeData, isPremium = false) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        const questionCount = isPremium ? 10 : 3;
        
        // 🌟 FIX: Dynamic Role Extraction
        // Agar user ne title nahi diya, toh AI ko "Professional" treat karne bolenge
        const userRole = resumeData.professionalTitle || "Professional";

        // 🌟 FIX: Dynamic Difficulty based on their actual role
        const difficultyTarget = isPremium 
            ? `Advanced, deep-dive scenario-based questions specific to the ${userRole} industry.` 
            : `Standard foundational and entry-level screening questions for a ${userRole}.`;

        const promptText = `
        You are an elite, highly adaptable expert interviewer for ALL industries globally.
        Analyze this resume and generate EXACTLY ${questionCount} highly relevant interview questions.
        
        CRITICAL RULES:
        1. Identify the candidate's exact industry (e.g., Software, Finance, Marketing, Healthcare, Arts, Management, etc.) based on their resume.
        2. Ask questions strictly relevant to THEIR specific field and the role of "${userRole}".
        3. DO NOT ask coding, technical, or FAANG questions UNLESS the resume clearly belongs to the Software/IT domain.
        4. Target Difficulty: ${difficultyTarget}
        
        Resume Data:
        ${JSON.stringify(resumeData)}
        `;

        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: interviewQuestionsSchema,
                    temperature: 0.2, // Low temperature rakhi hai taaki AI zyada hallucinate na kare
                }
            });
            return cleanAndParseAiJson(response.text);
        });

    } catch (error) {
        console.error("AI Interview Coach Error: ", error.message);
        if (error.statusCode === 429) throw error; 
        throw new Error("Failed to generate interview questions through AI.");
    }
};

export const enhanceTextWithAI = async (text) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        const promptText = `
        You are an expert Resume Writer and Career Coach. 
        Enhance the following rough text into a highly professional, impactful, and ATS-friendly statement.
        
        Rules:
        1. Use strong action verbs.
        2. Keep it concise (Max 2-3 sentences).
        3. DO NOT use markdown or bullet points. Return plain text only.
        
        Raw Text: "${text}"
        `;

        const response = await executeWithRetry(async () => {
            return await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: promptText,
            });
        });

        return response.text.trim();
    } catch (error) {
        console.error("AI Enhancement Error: ", error.message);
        if (error.statusCode === 429) throw error;
        throw new Error("Failed to enhance text through AI.");
    }
};