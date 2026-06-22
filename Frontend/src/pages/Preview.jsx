import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import ResumePDF from "../components/ResumePDF";
import {
  ArrowLeft,
  Download,
  SlidersHorizontal,
  Settings2,
  FileText,
  Save,
  Eye,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false); 

  const [pdfSettings, setPdfSettings] = useState({
    baseFontSize: 11,
    lineHeight: 1.4,
    sectionSpacing: 12,
  });

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/resume/share/${id}`,
        );
        const fetchedResume = response.data.resume;
        if (fetchedResume) {
          setResume(fetchedResume);
          if (fetchedResume.layoutSettings)
            setPdfSettings(fetchedResume.layoutSettings);
        }
      } catch (error) {
        toast.error("Failed to load document preview.");
      } finally {
        setLoading(false);
      }
    };
    fetchResumeData();
  }, [id]);

  const handleSettingChange = (e) =>
    setPdfSettings({
      ...pdfSettings,
      [e.target.name]: parseFloat(e.target.value),
    });

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    const toastId = toast.loading("Saving layout settings...");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/resume/update/${id}`,
        { layoutSettings: pdfSettings },
        { withCredentials: true },
      );
      toast.success("Layout locked! 🔒", { id: toastId });
    } catch (error) {
      toast.error("Failed to save layout.", { id: toastId });
    } finally {
      setIsSavingLayout(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading Engine...
      </div>
    );
  if (!resume)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Document not found.
      </div>
    );

  return (
    // 🌟 FIX: Removed negative margins. Now using simple h-full.
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Toaster position="top-right" />

      {/* Top Navbar */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-white truncate w-[140px] sm:w-[200px]">
              {resume.title || "Untitled"}
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500">
              Final Preview
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowMobilePreview(true)}
            className="lg:hidden flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={handleSaveLayout}
            disabled={isSavingLayout}
            className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            {isSavingLayout ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save size={16} /> Save
              </>
            )}
          </button>

          <PDFDownloadLink
            document={<ResumePDF data={resume} settings={pdfSettings} />}
            fileName={`${resume.title}_Resume.pdf`}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 md:px-5 md:py-2 rounded-xl text-sm font-medium shadow-sm"
          >
            {({ loading }) =>
              loading ? (
                "..."
              ) : (
                <>
                  <Download size={16} />{" "}
                  <span className="hidden sm:inline">Export PDF</span>
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls */}
        <div className="w-full lg:w-[350px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <SlidersHorizontal className="text-indigo-500" size={20} />
              <h2 className="font-bold text-slate-800 dark:text-white">
                Layout Controls
              </h2>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium text-slate-700 dark:text-slate-300">
                  <label>Base Font</label>
                  <span>{pdfSettings.baseFontSize} pt</span>
                </div>
                <input
                  type="range"
                  name="baseFontSize"
                  min="9"
                  max="13"
                  step="0.5"
                  value={pdfSettings.baseFontSize}
                  onChange={handleSettingChange}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium text-slate-700 dark:text-slate-300">
                  <label>Line Spacing</label>
                  <span>{pdfSettings.lineHeight}x</span>
                </div>
                <input
                  type="range"
                  name="lineHeight"
                  min="1.1"
                  max="1.8"
                  step="0.1"
                  value={pdfSettings.lineHeight}
                  onChange={handleSettingChange}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium text-slate-700 dark:text-slate-300">
                  <label>Section Gap</label>
                  <span>{pdfSettings.sectionSpacing} px</span>
                </div>
                <input
                  type="range"
                  name="sectionSpacing"
                  min="5"
                  max="20"
                  step="1"
                  value={pdfSettings.sectionSpacing}
                  onChange={handleSettingChange}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
            {/* Mobile Save Layout Button */}
            <button
              onClick={handleSaveLayout}
              disabled={isSavingLayout}
              className="sm:hidden w-full mt-8 flex justify-center items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            >
              {isSavingLayout ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} /> Save Layout Preferences
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right PDF Engine (Desktop Only) */}
        <div className="hidden lg:flex flex-1 bg-slate-950/50 p-8 items-center justify-center">
          <div className="w-full h-full max-w-[210mm] shadow-2xl bg-white">
            <PDFViewer
              width="100%"
              height="100%"
              className="border-none"
              showToolbar={false}
            >
              <ResumePDF data={resume} settings={pdfSettings} />
            </PDFViewer>
          </div>
        </div>
      </div>

      {/* MOBILE PREVIEW MODAL */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden flex flex-col"
          >
            <div className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 mt-12 rounded-t-2xl shadow-lg z-10">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Eye className="text-emerald-500" size={20} /> Live Preview
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-600 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
              <PDFViewer
                width="100%"
                height="100%"
                className="border-none"
                showToolbar={false}
              >
                <ResumePDF data={resume} settings={pdfSettings} />
              </PDFViewer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Preview;
