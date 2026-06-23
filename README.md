# MintCV SaaS 🚀

MintCV is an AI-powered, industry-agnostic career acceleration platform. It empowers candidates to build professional resumes, evaluate them against a strict 100-point ATS rubric, and practice dynamic, role-specific mock interviews.

## 🔗 Live Application
* **Frontend (App UI):** [https://mint-cv-saas.vercel.app](https://mint-cv-saas.vercel.app)
* **Backend (API Server):** [https://mintcv-saas.onrender.com](https://mintcv-saas.onrender.com)
---

## 🛠 Tech Stack

### Frontend
*   **Framework:** React.js (Vite)
*   **Styling:** Tailwind CSS & Framer Motion
*   **State Management:** Zustand
*   **PDF Generation:** `@react-pdf/renderer`

### Backend
*   **Runtime:** Node.js & Express.js
*   **Database:** MongoDB Atlas (Mongoose ODM)
*   **AI Engine:** Google Gemini API (gemini-2.5-flash)
*   **Payment:** Razorpay Integration

---

## 🚀 Key Features

*   **Smart Resume Builder:** Dynamic, real-time PDF generation with AI-powered text enhancement.
*   **Universal ATS Evaluator:** Gamified 100-point scoring system that adapts to any industry (Software, Finance, Arts, HR, etc.).
*   **Dynamic AI Interview Vault:** Context-aware mock interview questions based on the user's resume, with conceptual answer breakdowns.
*   **Fault-Tolerant Engine:** Implemented "Emergency AI Fallback Shields" to ensure the application never crashes, even if the AI fails or input data is malformed.
*   **Granular SaaS Quotas:** Server-side enforced daily limits and "Wire-Sliced" data protection for premium content.

---

## 🏗 System Design & Security

*   **Defensive Engineering:** Automated "Poisoned Cookie Flushes" in middleware to prevent auth-crash loops.
*   **Security Headers:** `helmet` integration for XSS & Clickjacking protection.
*   **Data Sanitization:** Active NoSQL injection protection using `express-mongo-sanitize`.
*   **API Resilience:** Implemented exponential backoff and rate-limiting (300 requests/15 mins) to prevent DDoS and API abuse.
*   **Graceful DevOps:** Process-level `SIGTERM` listeners ensure secure database connection disposal during cloud re-deployments.

---

## 📂 Project Structure

```text
/Backend
  ├── controllers/      # Business logic (Auth, Resume, AI)
  ├── middlewares/      # Security & Auth Bouncers
  ├── models/           # Mongoose Data Schemas
  ├── routes/           # REST API Endpoints
  ├── services/         # AI Logic & Fallback Engines
  └── server.js         # DevOps & Server Lifecycle

/Frontend
  ├── components/       # Reusable UI elements
  ├── pages/            # View Layer (Dashboard, Analytics, Interview)
  ├── store/            # Zustand Global State
  └── assets/           # UI Resources
```

🛡️ Monetization (Freemium Model)
Free Tier: Daily limits on imports, ATS evaluations, and mock generations.

Pro Tier: ₹199 Lifetime Access via Razorpay—unlocks unlimited AI scans, full 10-question interview scenarios, and the AI Text Enhancer.


👨‍💻 Developed By:

Charan Singh Yadav

Full Stack Developer | AI Enthusiast
