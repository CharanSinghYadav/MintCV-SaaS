import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, Crown, Zap, IndianRupee, FileText, BrainCircuit,
  ShieldAlert, Ban, CheckCircle, ArrowUpCircle, ArrowDownCircle, MessageSquare
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🌟 SECURITY CHECK: Sirf admin allow hoga
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // 🌟 FETCH ALL DATA
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, feedbacksRes] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + "/api/admin/stats", { withCredentials: true }),
          axios.get(import.meta.env.VITE_API_URL + "/api/admin/users", { withCredentials: true }),
          axios.get(import.meta.env.VITE_API_URL + "/api/admin/feedbacks", { withCredentials: true })
        ]);

        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users);
        setFeedbacks(feedbacksRes.data.feedbacks);
      } catch (error) {
        toast.error("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // 🌟 MANAGE USER ACTIONS
  const handleManageUser = async (userId, action) => {
    const toastId = toast.loading(`${action}ing user...`);
    try {
      const res = await axios.post(import.meta.env.VITE_API_URL + "/api/admin/manage", { userId, action }, { withCredentials: true });
      toast.success(res.data.message, { id: toastId });
      
      // Update local state to reflect changes instantly
      setUsers(users.map(u => {
        if (u._id === userId) {
          if (action === "upgrade") return { ...u, plan: "premium" };
          if (action === "downgrade") return { ...u, plan: "free" };
          if (action === "block") return { ...u, isBlocked: true };
          if (action === "unblock") return { ...u, isBlocked: false };
        }
        return u;
      }));
    } catch (error) {
      toast.error("Action failed.", { id: toastId });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full py-20"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldAlert className="text-indigo-500" size={32} /> Admin Control Center
        </h1>
        <p className="text-slate-500 mt-2">Manage users, view revenue, and monitor platform health.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {["overview", "users", "feedbacks"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🌟 TAB 1: OVERVIEW (Stats) */}
      {activeTab === "overview" && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl"><IndianRupee size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">₹{stats.totalRevenue}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Revenue</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl"><Users size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalUsers}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Users</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl"><Crown size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.premiumUsers}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Premium Users</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl"><Zap size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.freeUsers}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Free Users</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl"><FileText size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalResumes}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resumes Created</p></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="p-4 bg-teal-50 dark:bg-teal-500/10 text-teal-500 rounded-xl"><BrainCircuit size={28} /></div>
            <div><p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalAiHits}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total AI Hits</p></div>
          </div>
        </div>
      )}

      {/* 🌟 TAB 2: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Plan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{u.username}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.plan === "premium" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isBlocked ? <span className="text-red-500 flex items-center gap-1 text-xs font-bold"><Ban size={14}/> Blocked</span> : <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold"><CheckCircle size={14}/> Active</span>}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      {u.plan === "free" ? (
                        <button onClick={() => handleManageUser(u._id, "upgrade")} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors" title="Upgrade to Pro"><ArrowUpCircle size={18} /></button>
                      ) : (
                        <button onClick={() => handleManageUser(u._id, "downgrade")} className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors" title="Downgrade to Free"><ArrowDownCircle size={18} /></button>
                      )}
                      
                      {u.isBlocked ? (
                        <button onClick={() => handleManageUser(u._id, "unblock")} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors" title="Unblock User"><CheckCircle size={18} /></button>
                      ) : (
                        <button onClick={() => handleManageUser(u._id, "block")} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors" title="Block User"><Ban size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 TAB 3: FEEDBACKS */}
      {activeTab === "feedbacks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
          {feedbacks.length === 0 ? (
            <p className="text-slate-500 p-4">No feedback received yet.</p>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${fb.type === "Bug" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
                  {fb.type}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><MessageSquare size={18} /></div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{fb.user?.username || "Unknown User"}</p>
                    <p className="text-xs text-slate-500">{fb.user?.email || "No Email"}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  "{fb.message}"
                </p>
                <p className="text-[10px] text-slate-400 mt-3">{new Date(fb.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;