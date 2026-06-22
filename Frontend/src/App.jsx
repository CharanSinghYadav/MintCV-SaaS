import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalLayout from "./components/GlobalLayout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateResume from "./pages/CreateResume";
import EvaluateResume from "./pages/EvaluateResume";
import InterviewPrep from "./pages/InterviewPrep";
import Preview from "./pages/Preview";
import ProtectedRoute from "./components/ProtectedRoute";
import ResumeAnalytics from "./pages/ResumeAnalytics";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import InterviewLibrary from "./pages/InterviewLibrary";
import { useThemeStore } from "./store/themeStore";
import { useAuthStore } from "./store/authStore";

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      // 🌟 MintCV Theme Applied: Slate background aur Emerald spinner
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 🌍 PUBLIC ROUTES (Bina Sidebar ke) */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* 🌍 PREMIUM LANDING PAGE (Dark SaaS Theme) */}
        <Route
          path="/"
          element={
            <div className="relative min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white overflow-hidden">
              {/* Background Animations & Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
              <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
              <div
                className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse"
                style={{ animationDelay: "2s" }}
              ></div>

              <div className="z-10 flex flex-col items-center text-center px-4">
                <img
                  src="/logo-dark.png" /* Hamesha light logo use karenge dark bg pe */
                  alt="MintCV"
                  className="h-20 md:h-30 mb-8 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-500 hover:scale-110"
                />

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  The AI Resume Architect
                </h1>

                <p className="text-slate-400 max-w-lg mb-10 text-lg md:text-xl font-medium">
                  Build, evaluate, and perfect your FAANG-ready resume in
                  minutes using advanced AI analytics.
                </p>

                <a
                  href="/login"
                  className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-emerald-500 border border-emerald-500 rounded-xl hover:bg-emerald-600 hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1"
                >
                  Enter Workspace
                  <svg
                    className="w-5 h-5 ml-2 -mr-1 transition-transform duration-200 group-hover:translate-x-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          }
        />

        {/* 🛡️ PROTECTED ROUTES (Sidebar ke andar Wrapped) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <Dashboard />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-resume"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <CreateResume />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluate/:id"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <EvaluateResume />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview-prep/:id"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <InterviewPrep />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview/:id"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <Preview />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/:id"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <ResumeAnalytics />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <Settings />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <AdminDashboard />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <GlobalLayout>
                <InterviewLibrary />
              </GlobalLayout>
            </ProtectedRoute>
          }
        />
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
