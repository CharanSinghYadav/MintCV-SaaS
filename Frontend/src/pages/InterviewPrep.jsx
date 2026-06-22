import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore"; // 🌟 SURGERY 1: Import the Store
import { ArrowLeft, BrainCircuit, Eye, EyeOff, AlertTriangle, Sparkles, CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// 🌟 INTERACTIVE FLASHCARD COMPONENT
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
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question {index + 1}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColors[item.difficulty] || difficultyColors.Medium}`}>
            {item.difficulty}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6 leading-relaxed">
          {item.question}
        </h3>

        <button 
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          {showAnswer ? <><EyeOff size={18} /> Hide Answer</> : <><Eye size={18} /> Reveal Ideal Answer</>}
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
            <div className="p-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-200 mb-2 block flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" /> What the interviewer wants to hear:
              </span>
              {item.expectedAnswer}
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
  const { openPaywall } = useAuthStore(); 
  
  const [loading, setLoading] = useState(true);
  const [prepData, setPrepData] = useState(null);

  useEffect(() => {
    const fetchInterviewPrep = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/resume/interview-prep/${id}`, {
          withCredentials: true,
        });
        setPrepData(response.data.data);
      } catch (error) {
        //Global Paywall Logic
        if (error.response?.data?.requiresUpgrade) {
          toast.error("Daily AI limit reached! Upgrade to Premium.", { id: "global-paywall-toast" });
          openPaywall(); // 👈 PAYWALL OPEN
          navigate("/dashboard"); // Wapas feko user ko
        } else {
          toast.error("Failed to generate questions. Try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewPrep();
  }, [id, navigate, openPaywall]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <BrainCircuit size={56} className="text-indigo-500 animate-bounce mb-4 relative z-10" />
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI Coach is preparing your interview...</h2>
        <p className="text-slate-500 mt-2 text-sm">Crafting custom technical questions based on your resume</p>
      </div>
    );
  }

  if (!prepData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <AlertTriangle size={48} className="mb-4 text-red-400" />
        <p>Could not load interview prep.</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-indigo-500 hover:underline">Go back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-10 bg-slate-50 dark:bg-slate-950 -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-y-auto">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                AI Interview Coach <Sparkles className="text-indigo-500" />
              </h1>
              <p className="text-slate-500 mt-1">10 custom questions tailored to your profile.</p>
            </div>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2 rounded-xl">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-1">Detected Role</span>
            <span className="text-sm font-bold text-slate-800 dark:text-indigo-300">{prepData.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          {prepData.questionsList?.map((item, index) => (
            <QuestionCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;