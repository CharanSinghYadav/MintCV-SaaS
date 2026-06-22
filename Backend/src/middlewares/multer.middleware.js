/*
========================================================
FILE PURPOSE: multer.middleware.js
========================================================
Ye middleware frontend se aayi file ko pakad kar './public/temp' 
folder me temporarily save karta hai.
========================================================
*/
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb ka matlab callback function hai
        cb(null, "./public/temp") 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

export const upload = multer({ 
    storage, 
})