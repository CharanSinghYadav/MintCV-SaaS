/*
========================================================
FILE PURPOSE: ai.services.js
========================================================
*/

import { GoogleGenAI, Type } from "@google/genai";


// ==========================================
// 💡 HELPER: EXPONENTIAL BACKOFF RETRY LOGIC
// ==========================================
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

const resumeEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        atsScore: { type: Type.INTEGER, description: "ATS matching score out of 100" },
        feedback: { type: Type.STRING, description: "2-3 line general feedback about the resume" },
        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["atsScore", "feedback", "missingKeywords", "suggestions"]
};

// 🌟 SCHEMA: Schema ko MongoDB Schema ke sath align kar diya
const extractedResumeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        professionalTitle: { type: Type.STRING },
        // 🌟 FIX 1: Root level par Summary explicitly define kar di!
        summary: { 
            type: Type.STRING, 
            description: "The professional summary or objective statement from the resume" 
        }, 
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
                    // 🌟 AI ko force kiya ki coursework yahin daale
                    description: { 
                        type: Type.STRING,
                        description: "Relevant coursework, achievements, or projects done during this degree"
                    } 
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
        // 🌟 FIX 2: Certifications ke andar ki keys strictly define kar di
        // 🌟 AI KE SAR PE DANDA (Strict Constrained Schema)
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { 
                        type: Type.STRING,
                        description: "STRICTLY the Course Name ONLY (e.g., 'Career Essentials in Generative AI'). If the platform name is glued to it, strip the platform name out!"
                    },
                    issuer: { 
                        type: Type.STRING,
                        description: "The Issuing Authority or Platform ONLY (e.g., 'Microsoft & LinkedIn Learning', 'Infosys Springboard', 'TCS iON', 'MongoDB'). Do NOT leave this blank if an organization name appears next to the course!"
                    },
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
        1. Resume tables often mash the "Course Name" and "Issuing Platform" together. 
        2. You MUST separate them. (Example -> Input: "Web Development Infosys Springboard" | Output -> Title: "Web Development", Issuer: "Infosys Springboard"). 
        3. Never merge the issuer into the title string.

        Raw Resume Text:
        ${rawPdfText}
        `;

        const response = await executeWithRetry(async () => {
            return await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: extractedResumeSchema,
                    temperature: 0.2,
                }
            });
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("AI Extraction Error: ", error.message);
        if (error.statusCode === 429) throw error;
        throw new Error("Failed to extract data from PDF.");
    }
};

// ==========================================
// 2. THE AI FUNCTION
// ==========================================
export const evaluateResumeWithAI = async (resumeData) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        });

        const promptText = `
        You are an expert HR and ATS software.
        Evaluate this resume data and provide strict JSON output.
        
        Resume Data:
        ${JSON.stringify(resumeData)}
        `;

        // 🌟 Wrapped inside retry helper + JSON.parse inside the safety loop!
        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: resumeEvaluationSchema,
                    temperature: 0.2, // Strictly stable score
                }
            });
            return JSON.parse(response.text);
        });

    } catch (error) {
        console.error("AI Evaluation Error: ", error.message);
        if (error.statusCode === 429) throw error;
        throw new Error("Failed to evaluate resume through AI.");
    }
};


// ==========================================
// 3. INTERVIEW COACH SCHEMA (Native Format)
// ==========================================
const interviewQuestionsSchema = {
    type: Type.OBJECT,
    properties: {
        role: {
            type: Type.STRING,
            description: "The job role calculated based on the resume (e.g., Full Stack Developer, Frontend Engineer)"
        },
        questionsList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER, description: "Question number starting from 1" },
                    question: { type: Type.STRING, description: "The technical interview question" },
                    expectedAnswer: { type: Type.STRING, description: "The ideal code or conceptual answer the interviewer wants to hear" },
                    difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" }
                },
                required: ["id", "question", "expectedAnswer", "difficulty"]
            },
            description: "List of 10 customized interview questions based on the resume skills"
        }
    },
    required: ["role", "questionsList"]
};

// ============================================================================
// 4. THE INTERVIEW COACH (Tier-Aware: Free=3 Qs, Paid=10 Qs)
// ===========================================================================
export const generateInterviewQuestionsWithAI = async (resumeData, isPremium = false) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

        const questionCount = isPremium ? 10 : 3;
        const difficultyTarget = isPremium 
            ? "Mix of Medium and Advanced FAANG scenario-based coding traps." 
            : "Standard foundational and entry-level conceptual questions.";

        const promptText = `
        You are an elite technical interviewer.
        Analyze this resume and generate EXACTLY ${questionCount} highly relevant technical interview questions.
        Target Difficulty: ${difficultyTarget}
        
        Resume Data:
        ${JSON.stringify(resumeData)}
        `;

        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: interviewQuestionsSchema,
                    temperature: 0.2,
                }
            });
            return JSON.parse(response.text);
        });

    } catch (error) {
        console.error("AI Interview Coach Error: ", error.message);
        if (error.statusCode === 429) throw error; 
        throw new Error("Failed to generate interview questions through AI.");
    }
};

// ==========================================
// 7. THE AI ENHANCE FUNCTION (For Form Descriptions)
// ==========================================
export const enhanceTextWithAI = async (text) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENAI_API_KEY
        });

        const promptText = `
        You are an expert Resume Writer and Career Coach. 
        Enhance the following rough text into a highly professional, impactful, and ATS-friendly statement.
        
        Rules:
        1. Use strong action verbs (e.g., Engineered, Spearheaded, Developed).
        2. Keep it concise but impactful (Max 2-3 sentences).
        3. DO NOT use markdown, asterisks, or bullet points. Just return the plain text.
        4. Do not converse or add introductory text. ONLY return the enhanced text.
        
        Raw Text: "${text}"
        `;

        // Using your existing retry logic
        const response = await executeWithRetry(async () => {
            return await ai.models.generateContent({
                model: "gemini-2.5-flash",
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