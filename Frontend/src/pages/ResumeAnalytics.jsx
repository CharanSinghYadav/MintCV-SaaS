import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, Target, AlertTriangle, CheckCircle2, Zap, BrainCircuit } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// 🌟 THE SVG CIRCULAR SCORE GAUGE
const CircularScore = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-800" />
        <motion.circle
          cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={getColor()}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold ${getColor()}`}>{score}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">ATS Score</span>
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
        setAnalytics(response.data.evaluation);
      } catch (error) {
        if (error.response?.data?.requiresUpgrade) {
          toast.error("Daily AI limit reached! Upgrade to Premium.", { id: "global-paywall-toast" }); // Deduplicated toast
          openPaywall(); // 👈 PAYWALL OPEN
          navigate("/dashboard"); // Wapas feko user ko
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
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <BrainCircuit size={48} className="text-emerald-500 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI is scanning your resume...</h2>
        <p className="text-slate-500 mt-2 text-sm">Checking 100+ ATS parameters</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <AlertTriangle size={48} className="mb-4 text-red-400" />
        <p>Something went wrong. Could not load analytics.</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-emerald-500 hover:underline">Go back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-10 bg-slate-50 dark:bg-slate-950 -mx-4 md:-mx-8 -my-4 md:-my-8 overflow-y-auto">
      <Toaster position="top-center" />
      
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              Resume Analytics <Zap className="text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-slate-500 mt-1">AI-powered breakdown of your resume's strength.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl flex flex-col items-center text-center shadow-sm">
              <CircularScore score={analytics.atsScore} />
              <div className="mt-6 space-y-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                  {analytics.atsScore >= 75 ? "Excellent Match! 🚀" : analytics.atsScore >= 50 ? "Needs Improvement 🤔" : "Major Fixes Required 🚨"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{analytics.feedback}</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg"><Target size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Critical Missing Keywords</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">ATS systems scan for these industry-standard terms. Add them if you have the experience.</p>
              <div className="flex flex-wrap gap-2">
                {analytics.missingKeywords?.length > 0 ? (
                  analytics.missingKeywords.map((keyword, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-full">
                      + {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-500 text-sm font-medium flex items-center gap-2"><CheckCircle2 size={16} /> No major keywords missing!</span>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><CheckCircle2 size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Action Plan to Improve</h3>
              </div>
              <ul className="space-y-4">
                {analytics.suggestions?.map((suggestion, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalytics;