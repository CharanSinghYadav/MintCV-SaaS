import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const EvaluateResume = () => {
  const { id } = useParams(); // URL se resume ID nikal li
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchAIResult = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/resume/evaluate/${id}`, {
          withCredentials: true
        });
        
        // Backend se data nikal kar state me save kiya
        if (response.status === 200) {
          setResult(response.data.evaluation);
        }
      } catch (error) {
        toast.error("Failed to evaluate resume with AI.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIResult();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 sm:p-10 relative flex flex-col items-center">
      <Toaster position="top-right" />
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none fixed"></div>
      
      <div className="max-w-3xl w-full z-10 relative mt-10">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white mb-6">
          ← Back to Dashboard
        </button>

        {loading ? (
          // 🤖 AI SCANNING ANIMATION
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center shadow-2xl">
            <div className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
              Gemini AI is analyzing your resume...
            </h2>
            <p className="text-gray-400 mt-2">Checking ATS compatibility, keywords, and structuring.</p>
          </div>
        ) : result ? (
          // 📊 AI RESULT UI
          <div className="space-y-6">
            {/* Score & Feedback Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center rounded-full border-8 border-gray-800">
                <div className={`absolute inset-0 rounded-full border-8 ${result.atsScore >= 75 ? 'border-green-500' : result.atsScore >= 50 ? 'border-yellow-500' : 'border-red-500'} opacity-50`}></div>
                <h1 className="text-5xl font-extrabold text-white">{result.atsScore}</h1>
                <span className="absolute bottom-2 text-xs text-gray-400 font-bold tracking-widest uppercase">Score</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Feedback</h2>
                <p className="text-gray-300 leading-relaxed">{result.feedback}</p>
              </div>
            </div>

            {/* Missing Keywords Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                ⚠️ Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((keyword, idx) => (
                  <span key={idx} className="bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-1 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Suggestions Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                💡 Actionable Suggestions
              </h3>
              <ul className="space-y-3">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-300 bg-black/20 p-4 rounded-xl border border-gray-800">
                    <span className="text-green-500">✓</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-400">Failed to load AI evaluation.</div>
        )}
      </div>
    </div>
  );
};

export default EvaluateResume;