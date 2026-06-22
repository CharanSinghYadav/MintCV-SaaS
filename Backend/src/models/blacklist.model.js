/*
========================================================
FILE PURPOSE: blacklist.model.js
========================================================

Ye file un JWT tokens ko store karti hai jo expire ya logout ho chuke hain.

Simple language me:
JWT tokens stateless hote hain (backend unhe yaad nahi rakhta).
Agar user logout karta hai, toh token uske browser se delete ho jata hai,
par technically wo token abhi bhi valid hota hai jab tak uska time khatam na ho.

Security ke liye, hum logout hone wale tokens ko is "Blacklist" collection me
save kar dete hain. Ab jab bhi koi token aayega, hum pehle check karenge 
ki wo blacklist me toh nahi hai.
========================================================
*/

import mongoose, { Schema } from "mongoose";

const blacklistTokenSchema = new Schema(
    {
        token: {
            type: String,
            required: [true, "token is required to be added in blacklist"]
        }
    },
    { timestamps: true }
);

export const BlacklistToken = mongoose.model("BlacklistToken", blacklistTokenSchema);