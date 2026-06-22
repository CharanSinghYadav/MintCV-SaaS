/*
========================================================
FILE PURPOSE: multer.middleware.js
========================================================
Ye middleware frontend se aayi file ko pakad kar './public/temp' 
folder me temporarily save karta hai.
========================================================
*/
import multer from "multer";
import fs from "fs";
import path from "path";

// 🌟 FIX: Render ke ephemeral storage ke liye auto-directory creator
const tempDir = path.resolve("./public/temp");

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Callback ke andar bhi check karo (in case container sleep hoke wake up hua ho)
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Safe filename generator: spaces aur ajeeb symbols ko underscore se badlo
        const safeName = Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, safeName);
    }
});

export const upload = multer({ 
    storage, 
});