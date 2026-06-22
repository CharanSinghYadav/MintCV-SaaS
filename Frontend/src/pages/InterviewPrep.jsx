import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore"; 
import { ArrowLeft, BrainCircuit, Eye, EyeOff, AlertTriangle, Sparkles, CheckCircle, Lock, Crown, Zap } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const QuestionCard = ({ item, index }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const difficultyColors = {
    Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    Hard: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Question {index + 1}</span>
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${difficultyColors[item?.difficulty] || difficultyColors.Medium}`}>
            {item?.difficulty || "Scenario"}
          </span>
        </div>
        
        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 leading-relaxed">
          {item?.question || "Loading technical scenario..."}
        </h3>

        <button 
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          {showAnswer ? <><EyeOff size={16} /> Hide Ideal Answer</> : <><Eye size={16} /> Reveal What Interviewer Wants to Hear</>}
        </button>
      </div>

      <AnimatePresence>
        {showAnswer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
          >
            <div className="p-6 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 block flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" /> Target Answer Concept:
              </span>
              {item?.expectedAnswer || "Conceptual breakdown missing."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InterviewPrep = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openPaywall } = useAuthStore(); 
  
  const [loading, setLoading] = useState(true);
  const [prepData, setPrepData] = useState(null);
  const [isPremiumView, setIsPremiumView] = useState(false);

  useEffect(() => {
    const fetchInterviewPrep = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/resume/interview-prep/${id}`, {
          withCredentials: true,
        });

        // 🔥 FIX: Grabbed 'response.data.prep' specifically
        const payload = response.data.prep;
        setPrepData(payload);
        setIsPremiumView(response.data.isPremiumView);

      } catch (error) {
        if (error.response?.data?.requiresUpgrade) {
          toast.error("Daily AI limit reached! Upgrade to Premium.");
          openPaywall(); 
          navigate("/dashboard"); 
        } else {
          toast.error("Failed to generate questions. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewPrep();
  }, [id, navigate, openPaywall]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
        <div className="relative mb-6">
          <BrainCircuit size={64} className="text-indigo-500 animate-bounce relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 animate-pulse"></div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Coach is reverse-engineering your resume...</h2>
        <p className="text-slate-500 mt-2 text-sm font-medium max-w-md">Analyzing your tech stack, GitHub projects, and experience to generate specific FAANG interview scenarios.</p>
      </div>
    );
  }

  if (!prepData || !prepData.questionsList) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 px-4 text-center">
        <AlertTriangle size={52} className="mb-4 text-amber-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to compile interview script</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">Our AI couldn't find enough structured hard-skills in this document.</p>
        <button onClick={() => navigate("/dashboard")} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform">
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 transition-all shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Technical Mock Interview
                </h1>
                <Crown size={22} className={isPremiumView ? "text-amber-500 animate-bounce" : "text-slate-400"} />
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {isPremiumView ? "Showing all 10 VIP advanced FAANG scenarios." : "Showing 3 free fundamental screening questions."}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0">
            <Sparkles size={18} className="text-indigo-500 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">Target Profile</span>
              <span className="text-xs font-black text-slate-800 dark:text-indigo-200 capitalize">{prepData?.role || "Software Engineer"}</span>
            </div>
          </div>
        </div>

        {/* QUESTIONS LIST */}
        <div className="space-y-4">
          {prepData.questionsList.map((item, index) => (
            <QuestionCard key={index} item={item} index={index} />
          ))}

          {/* 🔥 THE GORGEOUS PRO PAYWALL LOCK BANNER (Rendered strictly for Free users!) */}
          {!isPremiumView && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-500/30 rounded-3xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>

              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <Lock size={30} className="text-slate-950" />
              </div>

              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
                7 Advanced FAANG Scenario Questions Locked
              </h3>
              
              <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
                Your free tier covers standard screening questions. Upgrade to MintCV Pro to instantly decrypt the remaining 7 deep-dive architecture traps specifically generated for your resume.
              </p>

              <button 
                onClick={openPaywall}
                className="bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/10 hover:scale-105 transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Zap size={18} className="fill-slate-950" /> Decrypt All 10 VIP Questions (₹199)
              </button>
              
              <span className="text-[10px] text-slate-500 block mt-4 font-bold tracking-wider uppercase">
                🔒 Safe Server-Side Enforcement • Instant MongoDB Cache Decryption
              </span>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;