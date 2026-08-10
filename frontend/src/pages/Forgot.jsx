import { API_BASE } from "../lib/apiClient";
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";


export default function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0)
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
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
        setTimer(60);
        setMessage({ type: "success", text: "OTP sent to your email." });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to send OTP",
        });
      }
    } catch {
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
        alert("Password reset successful!");
        navigate("/");
      } else {
        setMessage({ type: "error", text: data.message || "Reset failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Server error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT — Gradient + Typography */}
      <div className="hidden lg:flex relative items-center px-20 bg-gradient-to-br from-[#00FFB2] via-black-600 to-black text-white overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight mb-6">
            Forgot your key?
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            No worries! Enter your email to receive a secure OTP and reset your
            password.
          </p>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            {step === 1 ? "Verify Email" : "Reset Password"}
          </h2>
          <p className="text-gray-500 mb-8">
            {step === 1
              ? "Enter your email to receive a verification code."
              : "Enter the OTP and your new password to reset your account."}
          </p>

          {message.text && (
            <div
              className={`rounded-lg p-4 mb-5 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#14c596] text-black font-semibold hover:bg-[#21ab87] transition"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="mt-2 w-full px-4 py-3 text-center tracking-[0.3em] font-mono text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#14c596] focus:outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#14c596] text-black font-semibold hover:bg-[#21ab87] transition"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center mt-2 text-sm text-gray-500">
                Didn't receive the code?{" "}
                {timer > 0 ? (
                  <span className="font-medium text-gray-400">
                    Wait {timer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(null)}
                    className="text-[#14c596] font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <NavLink to="/" className="font-medium text-[#14c596]">
              Log in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
