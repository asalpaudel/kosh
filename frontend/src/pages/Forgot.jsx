import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";

const API_BASE = "http://localhost:8080/api";

export default function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Timer State
  const [timer, setTimer] = useState(0); 

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- HANDLERS ---

  const handleSendOtp = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep(2);
        setTimer(60); // Start 60s cooldown
        setMessage({ type: "success", text: "OTP Code sent to your email." });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send OTP" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Unable to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Password Reset Successful! Logging you out...");
        navigate("/");
      } else {
        setMessage({ type: "error", text: data.message || "Reset failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  // --- GRAPHICS (SVG) ---
  const ForgotIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full max-w-sm">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#00FFB2", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#00CC8E", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Abstract Background */}
      <circle cx="200" cy="150" r="120" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />
      <circle cx="200" cy="150" r="90" fill="none" stroke="#00FFB2" strokeWidth="1" opacity="0.5" />
      
      {/* Lock Icon */}
      <rect x="140" y="140" width="120" height="100" rx="10" fill="url(#grad1)" />
      <path d="M170 140 V100 A30 30 0 0 1 230 100 V140" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
      <circle cx="200" cy="190" r="12" fill="#000" />
      <path d="M200 190 V210" stroke="#000" strokeWidth="6" strokeLinecap="round" />

      {/* Floating Question Marks */}
      <text x="280" y="100" fill="#fff" fontSize="40" fontWeight="bold" transform="rotate(20 280 100)">?</text>
      <text x="100" y="120" fill="#fff" fontSize="30" fontWeight="bold" transform="rotate(-15 100 120)">?</text>
    </svg>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      
      {/* LEFT PANEL: Graphics */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Top Right Icon */}
        <div className="absolute top-4 right-4 p-2 rounded-lg border border-[#00FFB2]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#00FFB2" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>
        
        <div className="z-10 text-center">
            <ForgotIllustration />
            <h2 className="text-white text-2xl font-bold mt-6">Forgot your key?</h2>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">
                No worries, we'll send you a secure code to get you back into your account.
            </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 mt-2">
                {step === 1 ? "Enter your email to receive a verification code." : "Create a new password for your account."}
            </p>
          </div>

          {/* Status Message */}
          {message.text && (
            <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
              message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
            }`}>
              {message.type === "success" && <span>✨</span>}
              {message.type === "error" && <span>⚠️</span>}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {step === 1 ? (
            /* --- STEP 1: EMAIL --- */
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00FFB2] text-black font-bold py-3.5 rounded-full hover:bg-[#00e6a0] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-100"
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>
            </form>
          ) : (
            /* --- STEP 2: OTP & PASSWORD --- */
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              
              {/* OTP Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-5 py-3 text-center tracking-[0.5em] font-mono text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3.5 rounded-full hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-50 shadow-lg"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>

              {/* Resend Logic */}
              <div className="text-center mt-2">
                 <p className="text-sm text-gray-500">
                    Didn't receive the code?{" "}
                    {timer > 0 ? (
                        <span className="font-medium text-gray-400">Wait {timer}s</span>
                    ) : (
                        <button 
                            type="button" 
                            onClick={() => handleSendOtp(null)}
                            className="text-black font-semibold hover:underline"
                        >
                            Resend Code
                        </button>
                    )}
                 </p>
              </div>
            </form>
          )}

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <NavLink to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Login
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}