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
                model: "gemini-2.5-flash",
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

export const evaluateResumeWithAI = async (resumeData) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
        
        // 🌟 FIX: Implemented the 5-Parameter Rubric for accurate Scoring
        const promptText = `
        You are an expert HR and ATS software. Evaluate this resume data and provide strict JSON output.
        
        CALCULATE THE ATS SCORE STRICTLY USING THIS 5-PARAMETER RUBRIC (Total 100 points):
        1. Impact & Quantifiability (30 points): Do bullet points include metrics/numbers? (e.g., "Increased sales by 20%"). Penalize vague statements.
        2. Action Verbs (20 points): Do experience/project points start with strong action verbs (Architected, Spearheaded, Developed)?
        3. Parsability & Structure (20 points): Are essential sections present and adequately filled?
        4. Contact & Link Density (10 points): Are Email, Phone, and professional links (GitHub/LinkedIn/Portfolio) present?
        5. Fluff & Buzzwords (20 points): Deduct points heavily for generic fluff ("hardworking", "team player"). Award points for hard technical skills.

        Resume Data:
        ${JSON.stringify(resumeData)}
        `;

        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: resumeEvaluationSchema,
                    temperature: 0.2,
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