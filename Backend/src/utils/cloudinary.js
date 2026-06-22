/*
========================================================
FILE PURPOSE: cloudinary.js
========================================================
Ye utility server par aayi hui temporary file ko Cloudinary
par upload karti hai aur phir server se file ko delete (unlink) 
kar deti hai taaki server ka space full na ho.
========================================================
*/
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // Node.js ka in-built File System module

// .env file se details lekar Cloudinary ko configure karo
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // File upload karo
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Auto matlab image, pdf, video kuch bhi ho sambhal lega
        });

        // Upload successful hone ke baad temporary file delete kar do
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        // Agar upload fail ho jaye, tab bhi temporary file hata do warna virus/kachra jama ho jayega
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export { uploadOnCloudinary };