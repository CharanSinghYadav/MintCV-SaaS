import express from "express";
import { submitFeedback } from "../controllers/feedback.controller.js";
import authUser from "../middlewares/auth.middleware.js";

const feedbackRouter = express.Router();

// Route: POST /api/feedback/submit
// AuthRequired: Yes
feedbackRouter.post("/submit", authUser, submitFeedback);

export default feedbackRouter;