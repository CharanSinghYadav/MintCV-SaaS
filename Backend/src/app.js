/*
========================================================
FILE PURPOSE: app.js
========================================================

Ye file hamari Express application ko configure karti hai.

Simple language me:
Ye file hamare backend ka "Brain" hai. Yaha hum define karte hain:
- Kaun hamare backend se baat kar sakta hai (CORS)
- Data kis format me aayega (JSON)
- Cookies kaise read karni hain
- Saare routes (URLs) ko yaha joda jata hai
========================================================
*/
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

// 🌟 FIX: Smart Origin Normalizer (Strips accidental trailing slashes from Vercel requests)
const rawOrigins = [
  process.env.FRONTEND_URL,
  "https://mint-cv-saas.vercel.app", 
  "https://mintcv-saas.vercel.app", // Added non-hyphen fallback
  "http://localhost:5173", 
].filter(Boolean);

// Normalize array by removing any trailing slashes
const safeOrigins = rawOrigins.map(url => url.replace(/\/$/, ""));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow mobile apps / postman
      const cleanOrigin = origin.replace(/\/$/, "");
      if (safeOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Fortress Blocked: Origin ${cleanOrigin} is unauthorized.`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
    credentials: true,
  })
);

// 🌟 GATEWAY BOUNCER (Rate Limiting against DDOS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Take a 15-minute breather! 🧘‍♂️",
  },
});
app.use("/api", globalLimiter); 

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// NoSQL SANITIZER WRAPPER 
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);

  if (req.query) {
    const cleanedQuery = mongoSanitize.sanitize(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, cleanedQuery);
  }
  next();
});

// ========================================================
// 2. ROUTES IMPORT & DECLARATION
// ========================================================
import authRouter from "./routes/auth.routes.js";
import resumeRouter from "./routes/resume.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

// 🌟 404 CATCHER
app.use((req, res, next) => {
  res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} does not exist on MintCV Fortress.`,
  });
});

// 🌟 THE SAFETY NET: Global Error Gateway
app.use((err, req, res, next) => {
  console.error("🚨 [Global Backend Crash]:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production"
      ? "Something went wrong in the server room. Our tech architects are on it! 🛠️"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;