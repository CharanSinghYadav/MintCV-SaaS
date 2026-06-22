/*
========================================================
FILE PURPOSE: resume.model.js
========================================================

Ye file Resume ka database structure (Schema) define karti hai.

Simple language me:
Ek resume me kya kya hota hai? 
- Basic Details (Naam, phone, links)
- Experience (Pichli jobs)
- Education (College/School)
- Skills (React, Node.js, etc.)

Hum in sab sections ko arrays/objects me store karenge.
========================================================
*/

import mongoose, { Schema } from "mongoose";

const educationSchema = new Schema({
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    startDate: String,
    endDate: String,
    grade: String,
    description: String // 🌟 ADDED
});

const experienceSchema = new Schema({
    company: { type: String, required: true },
    position: { type: String, required: true },
    location: String,
    startDate: String,
    endDate: String,
    description: String 
});

const resumeSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true, default: "Untitled Resume" },
        professionalTitle: { type: String, default: "" },
        personalInfo: {
            fullName: String, email: String, phone: String, 
            portfolioUrl: String, githubUrl: String, linkedinUrl: String, location: String
        },
        summary: String,
        education: [educationSchema],
        experience: [experienceSchema],
        projects: [{
            title: { type: String, required: true },
            techStack: String,
            link: String,
            description: String
        }],
        skills: [String],
        certifications: [{ title: String, issuer: String, date: String, link: String }],
        languages: [String],
        customSections: [{ 
            sectionTitle: String, title: String, subtitle: String, 
            location: String, startDate: String, endDate: String, 
            link: String, description: String 
        }],
        layoutSettings: {
            baseFontSize: { type: Number, default: 11 },
            lineHeight: { type: Number, default: 1.4 },
            sectionSpacing: { type: Number, default: 12 }
        },
        lastAtsScore: { type: Number, default: null },
        interviewPrepCache: {
            type: Object,
            default: null 
        }
    },
    { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);