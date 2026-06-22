import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { BrainCircuit, Play, Lock, ChevronRight, Crown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const InterviewLibrary = () => {
  const navigate = useNavigate();
  const { user, openPaywall } = useAuthStore();
  const [vaultData, setVaultData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/resume/my-interviews`, {
          withCredentials: true,
        });
        setVaultData(response.data.vault);
        setIsPremium(response.data.isPremiumView);
      } catch (error) {
        toast.error("Failed to load Interview Vault.");
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      <Toaster position="top-right" />

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Interview Vault <BrainCircuit className="text-indigo-500" />
          </h1>
          <p className="text-slate-500 mt-1">Your lifetime library of customized technical scenarios.</p>
        </div>
        
        {!isPremium && (
          <button onClick={openPaywall} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:scale-105 transition-all">
            <Crown size={16} /> Unlock Full Vault
          </button>
        )}
      </div>

      {/* CONTENT AREA */}
      {vaultData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <BrainCircuit size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Your vault is empty</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">Generate interview questions from your Dashboard to build your library.</p>
          <button onClick={() => navigate("/dashboard")} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-all">
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vaultData.map((set, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={set.resumeId} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    Set {index + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(set.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 truncate">
                  {set.title}
                </h3>
                <p className="text-sm font-semibold text-slate-500 capitalize mb-6 truncate">
                  Role: {set.role}
                </p>

                {/* Progress Mini-Bar */}
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 mb-6">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>{isPremium ? set.totalQuestions : set.previewQuestions.length} / {set.totalQuestions} Questions</span>
                    {!isPremium && <Lock size={14} className="text-amber-500" />}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: isPremium ? '100%' : '30%' }}></div>
                  </div>
                  {!isPremium && <p className="text-[10px] text-slate-400 mt-2">7 locked. Upgrade to decrypt.</p>}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/interview-prep/${set.resumeId}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm"
              >
                <Play size={16} className={!isPremium ? "text-amber-400" : ""} /> 
                Start Mock Interview
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewLibrary;