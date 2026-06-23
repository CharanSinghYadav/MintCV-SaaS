import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, Target, AlertTriangle, CheckCircle2, Zap, BrainCircuit, Sparkles, ChevronRight, Flame } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// 🌟 FIX: Vercel-Style Glowing Gauge with soft background drop-blur
const CircularScore = ({ score }) => {
  const safeScore = Number(score) || 0; 
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  
  const getTheme = () => {
    if (safeScore >= 75) return { color: "text-emerald-500", glow: "bg-emerald-500/15", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", text: "Elite ATS Match 🔥" };
    if (safeScore >= 50) return { color: "text-amber-500", glow: "bg-amber-500/15", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", text: "Moderate Potential ⚡" };
    return { color: "text-red-500", glow: "bg-red-500/15", badge: "bg-red-500/10 text-red-400 border-red-500/20", text: "High Risk of Rejection ⚠️" };
  };

  const theme = getTheme();

  return (
    <div className="flex flex-col items-center justify-center p-4 relative">
      {/* Subtle Ambient Back-Glow */}
      <div className={`absolute w-36 h-36 rounded-full ${theme.glow} blur-2xl pointer-events-none transition-all duration-700`}></div>

      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-44 h-44">
          <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-800/60" />
          <motion.circle
            cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} // Smooth snappy cubic-bezier
            className={theme.color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-5xl font-black tracking-tighter ${theme.color}`}>{safeScore}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Out of 100</span>
        </div>
      </div>

      {/* Dynamic Status Pill */}
      <div className={`mt-4 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${theme.badge} flex items-center gap-1.5 shadow-sm`}>
        {theme.text}
      </div>
    </div>
  );
};

const ResumeAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openPaywall } = useAuthStore(); 
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/resume/evaluate/${id}`, {
          withCredentials: true,
        });
        
        const evalPayload = response.data.evaluation;
        if (evalPayload && typeof evalPayload.atsScore !== "undefined") {
           setAnalytics(evalPayload);
        } else {
           throw new Error("Backend returned malformed ATS data");
        }
      } catch (error) {
        if (error.response?.status === 429) {
           toast.error("AI Server is taking a breather. Please wait 1 minute! 🧘‍♂️");
        } else if (error.response?.data?.requiresUpgrade) {
          toast.error("Daily AI limit reached! Upgrade to Premium.", { id: "global-paywall-toast" }); 
          openPaywall(); 
          navigate("/dashboard"); 
        } else {
          toast.error("Failed to analyze resume. Try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id, navigate, openPaywall]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 select-none">
        <div className="relative mb-4">
          <BrainCircuit size={56} className="text-emerald-500 animate-bounce relative z-10" />
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse"></div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Evaluating ATS Rubric...</h2>
        <p className="text-slate-500 mt-1 text-xs font-semibold uppercase tracking-widest">Running 100-Point Mathematical Scan</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-center px-4">
        <AlertTriangle size={52} className="mb-4 text-amber-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Analysis Interrupted</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6 max-w-sm">We couldn't compile a valid mathematical scorecard for this specific document layout.</p>
        <button onClick={() => navigate("/dashboard")} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-12 bg-slate-50 dark:bg-slate-950 -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-y-auto transition-colors duration-300">
      <Toaster position="top-center" />
      
      <div className="max-w-5xl mx-auto space-y-10 pb-16">
        
        {/* 🌟 PREMIUM MINT-CV HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-2xl text-slate-600 dark:text-slate-300 transition-all shadow-sm cursor-pointer group">
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                ATS Scorecard 
                <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={12} /> V2 AI
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Calculated via Gamified 100-Point Industry Rubric.</p>
            </div>
          </div>

          <button onClick={() => navigate(`/interview-prep/${id}`)} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer hover:scale-105">
            <Flame size={15} className="fill-slate-950" /> Practice Mock Interview <ChevronRight size={14} />
          </button>
        </div>

        {/* 🌟 MAIN SPLIT DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT BUCKET: SCORE & AI SUMMARY (Spans 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
            >
              <CircularScore score={analytics.atsScore} />
              
              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800/80 my-6"></div>

              <div className="space-y-2 text-left w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BrainCircuit size={13} className="text-emerald-500" /> AI Executive Summary
                </span>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {analytics.feedback || "Your document structure is parsable, but formatting density and specific hard-skill metrics need optimization."}
                </p>
              </div>
            </motion.div>

            {/* Quick Tip Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
              <Zap size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">Pro-Tip:</span> ATS engines prioritize bullet points that start with action verbs and end with quantifiable numbers (%, $, or time).
              </p>
            </div>
          </div>

          {/* RIGHT BUCKET: KEYWORDS & ACTION PLAN (Spans 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 🌟 1. GLASSMORPHIC MISSING KEYWORDS PILLS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 }} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Target size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">High-Value Missing Keywords</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impact: 25 Pts</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                We cross-referenced your text against global job descriptions in your field. Inject these exact terms into your experience descriptions:
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {analytics.missingKeywords?.length > 0 ? (
                  analytics.missingKeywords.map((keyword, i) => (
                    <div key={i} className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:border-amber-500/40 transition-colors shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      {keyword}
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Flawless keyword density! No critical industry terms missing.
                  </div>
                )}
              </div>
            </motion.div>

            {/* 🌟 2. LINEAR-STYLE ACTION PLAN CARDS */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Step-by-Step Optimization Plan</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rubric Guide</span>
              </div>

              <div className="space-y-3 pt-2">
                {analytics.suggestions?.length > 0 ? (
                  analytics.suggestions.map((suggestion, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex items-start gap-3 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                      {/* Hover Side Accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        {i + 1}
                      </span>
                      <p className="flex-1 pt-0.5">{suggestion}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Your resume strictly satisfies the 100-point rubric parameters.</p>
                )}
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ResumeAnalytics;