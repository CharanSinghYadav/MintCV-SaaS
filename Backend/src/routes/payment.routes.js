import express from "express";
import { createPremiumOrder, verifyPremiumPayment } from "../controllers/payment.controller.js";
import authUser from "../middlewares/auth.middleware.js";

const paymentRouter = express.Router();

// Route 1: Bill generate karo
paymentRouter.post("/create-order", authUser, createPremiumOrder);

// Route 2: Payment verify karo
paymentRouter.post("/verify", authUser, verifyPremiumPayment);

export default paymentRouter;