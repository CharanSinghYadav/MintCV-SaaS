import express from "express";
import authUser from "../middlewares/auth.middleware.js";
import {
    getDashboardStats,
    getAllUsers,
    manageUser,
    getAllFeedbacks
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// 🌟 THE ROUTES
// Har raste par `authUser` ka bouncer laga hai taaki pata chale request kaun kar raha hai
adminRouter.get("/stats", authUser, getDashboardStats);
adminRouter.get("/users", authUser, getAllUsers);
adminRouter.post("/manage", authUser, manageUser);
adminRouter.get("/feedbacks", authUser, getAllFeedbacks);

export default adminRouter;