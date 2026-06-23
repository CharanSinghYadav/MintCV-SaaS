import { useState, memo, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PDFViewer } from "@react-pdf/renderer";
import ResumePDF from "../components/ResumePDF";
import useDebounce from "../hooks/useDebounce";
import { useResumeStore } from "../store/resumeStore";
import { useAuthStore } from "../store/authStore"; // 🌟 ADDED AUTH STORE IMPORT
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Wrench,
  ChevronDown,
  Save,
  ArrowLeft,
  Eye,
  FolderGit2,
  Award,
  Globe,
  Layers,
  X,
  Sparkles,
  Edit3,
  Crown // 🌟 ADDED CROWN ICON
} from "lucide-react";

const AccordionSection = ({
  title,
  icon: Icon,
  isActive,
  onClick,
  children,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all mb-4">
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer ${
          isActive
            ? "bg-emerald-50/50 dark:bg-emerald-500/10"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${isActive ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
          >
            <Icon size={20} />
          </div>
          <h3
            className={`font-semibold ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}
          >
            {title}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-5 border-t border-slate-100 dark:border-slate-800">
              {children}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

const MemoizedPDFView = memo(({ data, settings }) => {
  return (
    <PDFViewer
      width="100%"
      height="100%"
      className="border-none"
      showToolbar={false}
    >
      <ResumePDF data={data} settings={settings} />
    </PDFViewer>
  );
});

const CreateResume = () => {
  const navigate = useNavigate();
  const { user, openPaywall } = useAuthStore(); // 🌟 GET USER & PAYWALL FUNC
  const {
    resumeData,
    updateField,
    updateNestedField,
    addArrayItem,
    updateArrayItem,
    removeArrayItem,
    resetForm,
  } = useResumeStore();

  const debouncedResumeData = useDebounce(resumeData, 1000);
  const [activeSection, setActiveSection] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [enhancingKey, setEnhancingKey] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.importedData) {
      const data = location.state.importedData;
      const parseToString = (val) => Array.isArray(val) ? val.join(", ") : val || "";

      useResumeStore.setState((state) => {
        const cleanState = {
          title: "Untitled Resume",
          professionalTitle: "",
          personalInfo: { fullName: "", email: "", phone: "", portfolioUrl: "", githubUrl: "", linkedinUrl: "", location: "" },
          summary: "",
          education: [],
          experience: [],
          projects: [],
          skills: "",
          certifications: [],
          languages: "",
          customSections: []
        };

        return {
          resumeData: {
            ...cleanState,
            ...data,      
            
            title: data.title || cleanState.title,
            professionalTitle: data.professionalTitle || (data._id ? data.professionalTitle : data.title) || cleanState.professionalTitle,
            personalInfo: {
              ...cleanState.personalInfo, 
              ...(data.personalInfo || {}), 
            },
            skills: parseToString(data.skills),
            languages: parseToString(data.languages),
            experience: data.experience || [],
            education: data.education || [],
            projects: data.projects || [],
            certifications: data.certifications || [],
            customSections: data.customSections || [],
          },
        };
      });

      toast.success(
        data._id ? "Resume loaded for editing! ✏️" : "AI auto-filled your resume! 🎉",
        { id: "resume-load-toast" }
      );
    } else {
      resetForm();
    }
  }, [location.key]); 

  // 🌟 FIX: INSTANT PAYWALLING LOGIC (Client-Side)
  const handleEnhanceDescription = async (index, section, text) => {
    // 1. Instant check: Is user free? Show paywall instantly, don't hit API.
    if (user?.plan === "free" && user?.role !== "admin") {
      return openPaywall();
    }

    if (!text || text.trim().length < 10) {
      return toast.error("Please write at least a few words for AI to understand! 😅");
    }

    const key = index === null ? section : `${section}-${index}`;
    setEnhancingKey(key);

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/api/resume/enhance",
        { text },
        { withCredentials: true },
      );

      if (index === null) {
        updateField(section, response.data.enhancedText);
      } else {
        updateArrayItem(section, index, "description", response.data.enhancedText);
      }
      toast.success("Magic applied! ✨");
    } catch (error) {
      console.error(error);
      if (error.response?.status === 429) {
          toast.error("AI Server is busy. Please try again in a minute.");
      } else if (error.response?.data?.requiresUpgrade) {
        // Fallback if backend blocks it
        toast.error("Daily AI limit reached! Upgrade to Premium.");
        openPaywall(); 
      } else {
        toast.error("AI engine is sleeping or route not found!");
      }
    } finally {
      setEnhancingKey(null);
    }
  };
 
  const handleSave = async () => {
    if (!resumeData.title) return toast.error("Please name your resume.");
    setIsSaving(true);

    const cleanExperience = resumeData.experience.filter(exp => exp.company && exp.position);
    const cleanEducation = resumeData.education.filter(edu => edu.institution && edu.degree);
    const cleanProjects = resumeData.projects.filter(proj => proj.title);

    const formattedData = {
      ...resumeData,
      experience: cleanExperience,
      education: cleanEducation,
      projects: cleanProjects,
      skills: typeof resumeData.skills === "string" 
          ? resumeData.skills.split(",").map(s => s.trim()).filter(Boolean) 
          : resumeData.skills,
      languages: typeof resumeData.languages === "string" 
          ? resumeData.languages.split(",").map(s => s.trim()).filter(Boolean) 
          : resumeData.languages,
    };

    delete formattedData._id;
    delete formattedData.__v;
    delete formattedData.createdAt;
    delete formattedData.updatedAt;

    try {
        let response;
        if (resumeData._id) {
           response = await axios.put(`${import.meta.env.VITE_API_URL}/api/resume/update/${resumeData._id}`, formattedData, { withCredentials: true });
           toast.success("Resume updated!");
        } else {
           response = await axios.post(import.meta.env.VITE_API_URL + "/api/resume/create", formattedData, { withCredentials: true });
           toast.success("Resume created!");
           updateField("_id", response.data.resume._id);
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Validation failed: Check your inputs!");
    } finally {
        setIsSaving(false);
    }
  };

  const handleGoToPreview = () => {
    if (!resumeData._id) {
      toast.error(
        "Please click 'Save' (top right) before going to Preview! 💾",
        { icon: "⚠️" },
      );
    } else {
      navigate(`/preview/${resumeData._id}`);
    }
  };

  const stableSanitizedData = useMemo(() => {
    if (!debouncedResumeData) return null;
    return {
      ...debouncedResumeData,
      experience: debouncedResumeData.experience?.filter(exp => exp.company && exp.position) || [],
      education: debouncedResumeData.education?.filter(edu => edu.institution && edu.degree) || [],
      projects: debouncedResumeData.projects?.filter(proj => proj.title) || [],
      customSections: debouncedResumeData.customSections?.filter(c => c.title || c.sectionTitle) || []
    };
  }, [debouncedResumeData]); 

  // Helper component for AI Button to keep it DRY
  const AIEnhanceButton = ({ index, section, text, isEnhancing }) => (
      <button
        type="button"
        onClick={() => handleEnhanceDescription(index, section, text)}
        disabled={isEnhancing}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 border border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
      >
        {isEnhancing ? (
           <Sparkles size={14} className="animate-pulse text-amber-400" />
        ) : user?.plan === "free" && user?.role !== "admin" ? (
           <Crown size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
        ) : (
           <Sparkles size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
        )}
        {isEnhancing ? "Enhancing..." : "AI Enhance"}
      </button>
  );

  return (
    <>
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Toaster position="top-center" />

        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3 w-1/2 md:w-1/3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative flex items-center w-full group">
              <input
                type="text"
                value={resumeData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Name your resume..."
                className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-base font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none transition-all pr-8"
              />
              <Edit3
                size={15}
                className="absolute right-2.5 text-slate-400 group-hover:text-emerald-500 pointer-events-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobilePreview(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            >
              <Eye size={16} /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <Save size={16} /> Save
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-[45%] h-full overflow-y-auto p-6 md:p-8 hide-scrollbar">
            <div className="max-w-xl  mx-auto pb-20">
              <AccordionSection
                title="Personal Information"
                icon={User}
                isActive={activeSection === "personal"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "personal" ? "" : "personal",
                  )
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={resumeData.personalInfo.fullName}
                        onChange={(e) =>
                          updateNestedField(
                            "personalInfo",
                            "fullName",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={resumeData.professionalTitle}
                        onChange={(e) =>
                          updateField("professionalTitle", e.target.value)
                        }
                        placeholder="e.g. Full Stack Developer"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={resumeData.personalInfo.email}
                        onChange={(e) =>
                          updateNestedField(
                            "personalInfo",
                            "email",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={resumeData.personalInfo.phone}
                        onChange={(e) =>
                          updateNestedField(
                            "personalInfo",
                            "phone",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="md:col-span-2 relative mt-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Professional Summary
                        </label>
                        <textarea
                          value={resumeData.summary}
                          onChange={(e) =>
                            updateField("summary", e.target.value)
                          }
                          rows="4"
                          placeholder="Write 1-2 lines about yourself, let AI do the rest..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-none pb-12"
                        ></textarea>
                        
                        <AIEnhanceButton 
                          index={null} 
                          section="summary" 
                          text={resumeData.summary} 
                          isEnhancing={enhancingKey === "summary"} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>

              <AccordionSection
                title="Work Experience"
                icon={Briefcase}
                isActive={activeSection === "experience"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "experience" ? "" : "experience",
                  )
                }
              >
                {resumeData.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 relative group"
                  >
                    <button
                      onClick={() => removeArrayItem("experience", index)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            index,
                            "company",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Role"
                        value={exp.position}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            index,
                            "position",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Start Date (e.g. Jan 2023)"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            index,
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="End Date (e.g. Present)"
                        value={exp.endDate}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            index,
                            "endDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="relative mt-3">
                      <textarea
                        placeholder="Type what you did, and let AI make it professional..."
                        value={exp.description}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl outline-none focus:border-emerald-500 text-sm h-28 resize-none text-slate-800 dark:text-slate-200 pb-12 transition-all"
                      ></textarea>

                      <AIEnhanceButton 
                          index={index} 
                          section="experience" 
                          text={exp.description} 
                          isEnhancing={enhancingKey === `experience-${index}`} 
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    addArrayItem("experience", {
                      company: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  + Add Experience
                </button>
              </AccordionSection>

              <AccordionSection
                title="Education"
                icon={GraduationCap}
                isActive={activeSection === "education"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "education" ? "" : "education",
                  )
                }
              >
                {resumeData.education.map((edu, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 relative group"
                  >
                    <button
                      onClick={() => removeArrayItem("education", index)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Institution / College"
                        value={edu.institution}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            index,
                            "institution",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Degree (e.g. B.Tech)"
                        value={edu.degree}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            index,
                            "degree",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            index,
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            index,
                            "endDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Grade / CGPA"
                      value={edu.grade}
                      onChange={(e) =>
                        updateArrayItem(
                          "education",
                          index,
                          "grade",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm mt-3 text-slate-800 dark:text-slate-200"
                    />

                    <textarea
                      placeholder="Relevant coursework, achievements, or learnings..."
                      value={edu.description || ""}
                      onChange={(e) =>
                        updateArrayItem(
                          "education",
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-md outline-none focus:border-emerald-500 text-sm mt-3 h-20 resize-none text-slate-800 dark:text-slate-200"
                    ></textarea>
                  </div>
                ))}
                <button
                  onClick={() =>
                    addArrayItem("education", {
                      institution: "",
                      degree: "",
                      startDate: "",
                      endDate: "",
                      grade: "",
                      description: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  + Add Education
                </button>
              </AccordionSection>

              <AccordionSection
                title="Skills"
                icon={Wrench}
                isActive={activeSection === "skills"}
                onClick={() =>
                  setActiveSection(activeSection === "skills" ? "" : "skills")
                }
              >
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Comma separated skills (e.g. React, Node, AWS)
                </label>
                <textarea
                  value={resumeData.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all h-24 resize-none"
                ></textarea>
              </AccordionSection>

              <AccordionSection
                title="Projects"
                icon={FolderGit2}
                isActive={activeSection === "projects"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "projects" ? "" : "projects",
                  )
                }
              >
                {resumeData.projects.map((proj, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 relative group"
                  >
                    <button
                      onClick={() => removeArrayItem("projects", index)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={(e) =>
                          updateArrayItem(
                            "projects",
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Tech Stack (e.g. MERN)"
                        value={proj.techStack}
                        onChange={(e) =>
                          updateArrayItem(
                            "projects",
                            index,
                            "techStack",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Live Link or GitHub"
                      value={proj.link}
                      onChange={(e) =>
                        updateArrayItem(
                          "projects",
                          index,
                          "link",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm mt-3 text-slate-800 dark:text-slate-200"
                    />
                    <div className="relative mt-3">
                      <textarea
                        placeholder="What did you build? (e.g. Made an app using React)..."
                        value={proj.description}
                        onChange={(e) =>
                          updateArrayItem(
                            "projects",
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-md outline-none focus:border-emerald-500 text-sm h-28 resize-none text-slate-800 dark:text-slate-200 pb-12 transition-all"
                      ></textarea>

                      <AIEnhanceButton 
                          index={index} 
                          section="projects" 
                          text={proj.description} 
                          isEnhancing={enhancingKey === `projects-${index}`} 
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    addArrayItem("projects", {
                      title: "",
                      techStack: "",
                      link: "",
                      description: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  + Add Project
                </button>
              </AccordionSection>

              <AccordionSection
                title="Certifications"
                icon={Award}
                isActive={activeSection === "certifications"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "certifications" ? "" : "certifications",
                  )
                }
              >
                {resumeData.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 relative group"
                  >
                    <button
                      onClick={() => removeArrayItem("certifications", index)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Certificate Title"
                        value={cert.title}
                        onChange={(e) =>
                          updateArrayItem(
                            "certifications",
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Issuer (e.g. Coursera)"
                        value={cert.issuer}
                        onChange={(e) =>
                          updateArrayItem(
                            "certifications",
                            index,
                            "issuer",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Year / Date"
                        value={cert.date}
                        onChange={(e) =>
                          updateArrayItem(
                            "certifications",
                            index,
                            "date",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Credential URL"
                      value={cert.link}
                      onChange={(e) =>
                        updateArrayItem(
                          "certifications",
                          index,
                          "link",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm mt-3 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    addArrayItem("certifications", {
                      title: "",
                      issuer: "",
                      date: "",
                      link: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  + Add Certification
                </button>
              </AccordionSection>

              <AccordionSection
                title="Languages"
                icon={Globe}
                isActive={activeSection === "languages"}
                onClick={() =>
                  setActiveSection(
                    activeSection === "languages" ? "" : "languages",
                  )
                }
              >
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Comma separated languages (e.g. English, Hindi, Spanish)
                </label>
                <textarea
                  value={resumeData.languages}
                  onChange={(e) => updateField("languages", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all h-16 resize-none"
                ></textarea>
              </AccordionSection>

              <AccordionSection
                title="Custom Section"
                icon={Layers}
                isActive={activeSection === "custom"}
                onClick={() =>
                  setActiveSection(activeSection === "custom" ? "" : "custom")
                }
              >
                {resumeData.customSections.map((custom, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 relative group"
                  >
                    <button
                      onClick={() => removeArrayItem("customSections", index)}
                      className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Section Heading (e.g. Volunteering)"
                        value={custom.sectionTitle}
                        onChange={(e) =>
                          updateArrayItem(
                            "customSections",
                            index,
                            "sectionTitle",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={custom.title}
                        onChange={(e) =>
                          updateArrayItem(
                            "customSections",
                            index,
                            "title",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Organization / Location"
                        value={custom.location}
                        onChange={(e) =>
                          updateArrayItem(
                            "customSections",
                            index,
                            "location",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Date Range"
                        value={custom.startDate}
                        onChange={(e) =>
                          updateArrayItem(
                            "customSections",
                            index,
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <textarea
                      placeholder="Description..."
                      value={custom.description}
                      onChange={(e) =>
                        updateArrayItem(
                          "customSections",
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-md outline-none focus:border-emerald-500 text-sm mt-3 h-20 resize-none text-slate-800 dark:text-slate-200"
                    ></textarea>
                  </div>
                ))}
                <button
                  onClick={() =>
                    addArrayItem("customSections", {
                      sectionTitle: "",
                      title: "",
                      subtitle: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      link: "",
                      description: "",
                    })
                  }
                  className="w-full py-2 border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  + Add Custom Field
                </button>
              </AccordionSection>
            </div>
          </div>

          <div className="hidden lg:flex flex-col w-[55%] h-full bg-slate-200/50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800 p-6 items-center">
            <div className="w-full max-w-[210mm] mb-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl flex items-center justify-between shadow-sm shrink-0">
              <span className="text-sm font-medium flex items-center gap-2">
                <Sparkles size={16} /> Resume spilling to page 2? Adjust spacing
                in Preview step.
              </span>
              <button
                onClick={handleGoToPreview}
                className="text-xs font-bold bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer"
              >
                Go to Preview 🎛️
              </button>
            </div>

            <div className="w-full h-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden bg-white">
              <MemoizedPDFView
                data={stableSanitizedData}
                settings={debouncedResumeData?.layoutSettings} 
              />
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden flex flex-col"
          >
            <div className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 rounded-t-2xl mt-12 shadow-lg z-10">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Eye className="text-emerald-500" size={20} />
                Live PDF Preview
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
              <MemoizedPDFView
                data={stableSanitizedData}
                settings={debouncedResumeData?.layoutSettings} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateResume;