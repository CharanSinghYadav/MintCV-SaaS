import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import {
  LayoutDashboard, Settings, Moon, Sun, Menu, X, LogOut, MessageSquarePlus, Send, Crown, Check, Zap, ShieldAlert, BrainCircuit
} from "lucide-react";

const GlobalLayout = ({ children }) => {
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { user, isPaywallOpen, closePaywall, checkAuth, logout } = useAuthStore(); 
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Interview Vault", path: "/interviews", icon: <BrainCircuit size={20} /> },
    { 
      name: "Give Feedback", 
      isAction: true, 
      onClick: () => { setIsFeedbackModalOpen(true); setIsMobileMenuOpen(false); },
      icon: <MessageSquarePlus size={20} /> 
    },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  if (user?.role === "admin") {
    navLinks.push({ name: "Admin Panel", path: "/admin", icon: <ShieldAlert size={20} /> });
  }

  const isWorkspace = location.pathname.includes("/create-resume") || location.pathname.includes("/preview");

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return toast.error("Please enter a message!");
    setIsSubmitting(true);
    const toastId = toast.loading("Sending feedback...");
    try {
      await axios.post(import.meta.env.VITE_API_URL + "/api/feedback/submit", { type: feedbackType, message: feedbackMessage }, { withCredentials: true });
      toast.success("Feedback sent! Thank you. 🎉", { id: toastId });
      setIsFeedbackModalOpen(false);
      setFeedbackMessage("");
      setFeedbackType("Suggestion");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send feedback", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(import.meta.env.VITE_API_URL + "/api/auth/logout", { withCredentials: true });
      logout(); 
      toast.success("Logged out successfully! 👋");
      navigate("/login"); 
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!window.Razorpay) return toast.error("Razorpay SDK failed to load. Please check your internet connection.");
    setIsCheckoutLoading(true);
    const toastId = toast.loading("Connecting secure gateway...");

    try {
      const orderRes = await axios.post(import.meta.env.VITE_API_URL + "/api/payment/create-order", {}, { withCredentials: true });
      const order = orderRes.data.order;

      const rzpKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!rzpKeyId || rzpKeyId.includes('"') || rzpKeyId.includes('{')) {
        toast.dismiss(toastId);
        toast.error("Frontend Config Error: Malformed Razorpay Public Key!");
        setIsCheckoutLoading(false);
        return;
      }

      if (!order || !order.id) {
        toast.dismiss(toastId);
        toast.error("Backend failed to return a valid Order ID!");
        setIsCheckoutLoading(false);
        return;
      }

      const options = {
        key: rzpKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "MintCV Pro",
        description: "Lifetime VIP Access",
        image: "/logo-dark.png",
        order_id: order.id,
        handler: async function (response) {
          const verifyToast = toast.loading("Verifying payment with bank...");
          try {
            const res = await axios.post(import.meta.env.VITE_API_URL + "/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, { withCredentials: true });

            toast.success(res.data.message, { id: verifyToast });
            closePaywall(); 
            checkAuth(); 
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment Verification Failed", { id: verifyToast });
          }
        },
        prefill: { 
          name: String(user?.username || "MintCV Member"), 
          email: String(user?.email || "member@mintcv.com") 
        },
        theme: { color: "#10B981" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) { 
        toast.error(response.error.description || "Transaction dropped by gateway."); 
      });
      rzp.open();
      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Failed to initiate gateway connection.", { id: toastId });
      console.error("Gateway Handshake Dump:", error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden font-sans">
      
      <div className="md:hidden fixed top-0 w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center h-full group cursor-pointer">
          <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="MintCV" className="h-7 sm:h-8 object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === "light" ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-amber-400" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <aside className={`fixed md:static top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 z-40 ${isMobileMenuOpen ? "translate-x-0 pt-16" : "-translate-x-full md:translate-x-0"}`}>
        {/* 🌟 FIX: Elegant Logo Animation */}
        <div className="hidden md:flex items-center gap-2 h-20 px-6 border-b border-slate-200 dark:border-slate-800 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
          <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="MintCV" className="h-8 object-contain transition-transform duration-500 group-hover:scale-105" />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-left"
                >
                  {item.icon} {item.name}
                </button>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"}`}>
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button onClick={toggleTheme} className="hidden md:flex w-full items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-colors">
            <span className="font-medium">Dark Mode</span>
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
          </button>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {isWorkspace ? <div className="w-full h-full">{children}</div> : <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>}
      </main>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      {isPaywallOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <button onClick={closePaywall} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"><X size={22} /></button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Crown size={26} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Unlock MintCV Pro</h3>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Lifetime Career Pass</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              You have reached your free tier limit. Upgrade now to unlock industry-leading AI tools and supercharge your FAANG job hunt.
            </p>

            <div className="space-y-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 mb-8">
              {[
                "Create & Save Unlimited Resume Variations",
                "Unlimited AI ATS Scans & Resume Enhancer",
                "Deep-Dive Technical AI Mock Interviews (Role-specific)",
                "Instant Access to all Future Pro Layouts",
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  {feat}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-3xl font-extrabold text-white">₹199</span>
                <span className="text-xs text-slate-400 ml-1.5">/ one-time</span>
              </div>
              <button onClick={handleRazorpayCheckout} disabled={isCheckoutLoading} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
                {isCheckoutLoading ? "Connecting Bank..." : <><Zap size={18} className="fill-slate-950" /> Pay & Upgrade Now</>}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-6">🔒 Secured by Razorpay India • Instant Access</p>
          </div>
        </div>
      )}

      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsFeedbackModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X size={20} /></button>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><MessageSquarePlus className="text-emerald-500" /> Share Feedback</h3>
              <p className="text-sm text-slate-500 mt-1">Found a bug or have an idea? Let us know!</p>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Feedback Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Suggestion", "Bug"].map((type) => (
                    <button key={type} type="button" onClick={() => setFeedbackType(type)} className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors border ${feedbackType === type ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder="Explain what happened or what you'd like to see..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-32" required></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <span className="animate-pulse">Sending...</span> : <><Send size={16} /> Submit Feedback</>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GlobalLayout;