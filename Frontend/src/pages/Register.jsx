import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { UserPlus, User, Mail, Lock } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error("Passwords do not match!");
    const toastId = toast.loading("Creating your account...");
    try {
      const response = await axios.post("http://localhost:3000/api/auth/register", formData);
      if (response.status === 201) {
        toast.success(response.data.message || "Account created successfully!", { id: toastId });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      <Toaster position="top-right" />

      {/* 🌟 MintCV Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-teal-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 z-10 my-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">Join the Future</h2>
          <p className="text-slate-400 mt-2 text-sm">Create your AI-powered workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" name="username" value={formData.username} placeholder="Username" required onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="email" name="email" value={formData.email} placeholder="Email Address" required onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="password" name="password" value={formData.password} placeholder="Password" required onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="password" name="confirmPassword" value={formData.confirmPassword} placeholder="Confirm Password" required onChange={handleChange} className="w-full pl-10 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
          </div>

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 mt-2 transform hover:-translate-y-0.5">
            Create Account
          </button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;