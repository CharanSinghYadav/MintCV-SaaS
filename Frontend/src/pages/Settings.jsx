import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { User, Shield, CreditCard, Moon, Sun, Crown, Zap } from "lucide-react";

const Settings = () => {
  const { user, openPaywall } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your MintCV workspace and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Navigation Tabs */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === "profile" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
          >
            <User size={18} /> My Profile
          </button>
          <button 
            onClick={() => setActiveTab("billing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === "billing" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
          >
            <CreditCard size={18} /> Billing & Plan
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === "security" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Right Column: Settings Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Profile Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Username</label>
                  <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium capitalize">
                    {user?.username || "Loading..."}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                  <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {user?.email || "Loading..."}
                  </div>
                </div>
              </div>

              {/* Preferences embedded in Profile */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Theme Preference</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between Light and Dark mode.</p>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Crown size={80} /></div>
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">Current Plan: <span className="uppercase tracking-wide">{user?.plan || "FREE"}</span></h3>
                <p className="text-emerald-100 text-sm mb-6 max-w-[80%]">
                  {user?.plan === "premium" 
                    ? "You have unlimited access to AI tools, ATS checks, and premium templates." 
                    : "You are on the free tier. You have 1 AI scan limit per day."}
                </p>
                {user?.plan !== "premium" && (
                  <button onClick={openPaywall} className="flex items-center gap-2 bg-white text-emerald-600 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all">
                    <Zap size={16} className="fill-emerald-600" /> Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Shield size={24} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Settings</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">Password changes and Two-Factor Authentication (2FA) will be available in the next update.</p>
              <button disabled className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-5 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed">
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;