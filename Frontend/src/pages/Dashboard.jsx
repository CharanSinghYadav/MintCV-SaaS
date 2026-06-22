import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText, CheckCircle, TrendingUp, Plus, Edit3, Eye, Sparkles,
  MessageSquare, Search, Trash2, AlertTriangle, Crown, Zap
} from "lucide-react";

// Helper for beautiful name formatting
const formatName = (rawName) => {
  if (!rawName) return "User";
  return rawName
    .replace(/[_]/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
};

const Dashboard = () => {
  const { user, openPaywall } = useAuthStore(); 
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMyResumes = async () => {
      try {
        const response = await axios.get(import.meta.env.VITE_API_URL + "/api/resume/my-resumes", { withCredentials: true });
        setResumes(response.data.resumes);
      } catch (error) {
        toast.error("Failed to load your resumes.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyResumes();
  }, []);

  const handleInitiateCreate = (actionType) => {
    if (actionType === "blank") navigate("/create-resume");
    if (actionType === "import") fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed!");

    const formData = new FormData();
    formData.append("resumeFile", file);

    setIsUploading(true);
    const toastId = toast.loading("AI is reading your PDF... ✨");

    try {
      const response = await axios.post(import.meta.env.VITE_API_URL + "/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      toast.success("Resume parsed successfully!", { id: toastId });
      navigate("/create-resume", { state: { importedData: response.data.resumeData } });
    } catch (error) {
      if (error.response?.data?.requiresUpgrade) {
        toast.error("Daily AI limit reached! Upgrade to Premium.", { id: toastId });
        openPaywall(); 
      } else {
        toast.error("Failed to parse PDF.", { id: toastId });
      }
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Moving to trash...");
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/resume/delete/${resumeToDelete}`, { withCredentials: true });
      setResumes((prev) => prev.filter((r) => r._id !== resumeToDelete));
      toast.success("Resume deleted!", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete.", { id: toastId });
    } finally {
      setIsDeleting(false);
      setResumeToDelete(null);
    }
  };

  const scoredResumes = resumes.filter((r) => r.lastAtsScore && r.lastAtsScore > 0);
  const avgMatchScore = scoredResumes.length ? Math.round(scoredResumes.reduce((acc, r) => acc + r.lastAtsScore, 0) / scoredResumes.length) : 0;
  const totalInterviews = resumes.filter(r => r.interviewPrepCache).length;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      <Toaster position="top-right" />

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {/* 🌟 FIX: Consistent Brand Accent (Emerald instead of Indigo) */}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-emerald-600 dark:text-emerald-400">{formatName(user?.username)}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">Create, evaluate and land your dream job.</p>
        </div>
        
        {user?.plan === "premium" ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl text-amber-500 font-bold text-sm shadow-sm">
            <Crown size={18} className="animate-bounce" /> VIP PREMIUM ACTIVE
          </div>
        ) : (
          <button onClick={openPaywall} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer">
            <Zap size={16} /> Upgrade to Pro
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl"><FileText size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800 dark:text-white">{resumes.length}</p><p className="text-xs font-medium text-slate-500 uppercase">My Resumes</p></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl"><CheckCircle size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800 dark:text-white">{scoredResumes.length}</p><p className="text-xs font-medium text-slate-500 uppercase">ATS Scans</p></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl"><MessageSquare size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800 dark:text-white">{totalInterviews}</p><p className="text-xs font-medium text-slate-500 uppercase">Interviews</p></div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800 dark:text-white">{avgMatchScore}%</p><p className="text-xs font-medium text-slate-500 uppercase">Avg Score</p></div>
        </div>
      </div>

      {/* My Resumes Section */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Documents</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search resumes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* 🌟 FIX: Brand-aligned Create Box */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl min-h-[280px] flex flex-col justify-center items-center p-6 hover:border-emerald-500 transition-all text-center relative overflow-hidden group">
              <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={28} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Create Document</h3>
              <p className="text-xs text-slate-500 mb-6">Build from scratch or scan PDF</p>

              <div className="flex flex-col gap-3 w-full max-w-[200px] z-10">
                <button onClick={() => handleInitiateCreate("blank")} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <Plus size={16} /> Start Blank
                </button>
                <button onClick={() => handleInitiateCreate("import")} disabled={isUploading} className="w-full bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  {isUploading ? "Parsing..." : <><Sparkles size={16} /> Scan PDF (1/Day)</>}
                </button>
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </div>
            </div>

            {resumes.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map((resume) => (
              <div key={resume._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group relative">
                
                {/* 🌟 FIX: Popping Dark Mode Thumbnail Card */}
                <div className="h-40 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 relative flex justify-center items-end overflow-hidden pt-4 transition-colors">
                  <div className="w-32 h-36 bg-white dark:bg-slate-800 rounded-t-md shadow-lg border border-slate-200 dark:border-slate-600 p-3 flex flex-col gap-2 relative transform translate-y-3 group-hover:translate-y-1 transition-transform">
                    <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-1.5 truncate">
                      <h4 className="text-[9px] font-bold text-slate-800 dark:text-slate-200 uppercase">{resume.title}</h4>
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-60">
                      <div className="w-full h-[3px] bg-slate-300 dark:bg-slate-500 rounded-full"></div>
                      <div className="w-5/6 h-[3px] bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                    </div>
                  </div>
                  
                  {resume.lastAtsScore && (
                    <div className="absolute top-3 left-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                      {resume.lastAtsScore}% Match
                    </div>
                  )}

                  <button onClick={() => setResumeToDelete(resume._id)} className="absolute top-3 right-3 bg-white/80 dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate" title={resume.title}>{resume.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Updated: {new Date(resume.updatedAt).toLocaleString("en-US", { 
                        month: "short", 
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true 
                      })}
                    </p>
                  </div>
                  
                  {/* 🌟 FIX: UX-Corrected Button Grid (Eye icon = 'View') */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                    <button onClick={() => navigate("/create-resume", { state: { importedData: resume } })} className="flex justify-center items-center gap-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl transition-colors cursor-pointer">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => navigate(`/preview/${resume._id}`)} className="flex justify-center items-center gap-1.5 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer">
                      <Eye size={14} /> Download
                    </button>
                    <button onClick={() => navigate(`/analytics/${resume._id}`)} className="flex justify-center items-center gap-1.5 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl transition-colors cursor-pointer">
                      <Sparkles size={14} /> Score
                    </button>
                    <button onClick={() => navigate(`/interview-prep/${resume._id}`)} className="flex justify-center items-center gap-1.5 text-[11px] font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 py-2.5 rounded-xl transition-colors cursor-pointer">
                      <MessageSquare size={14} /> Prep
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 FIX: Updated Delete Confirmation Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="mx-auto text-red-500 mb-2" size={42} />
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Permanently delete?</h3>
              <p className="text-sm text-slate-400">
                This action cannot be undone. This will permanently delete your resume and all associated AI interview data.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setResumeToDelete(null)} 
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteResume} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;