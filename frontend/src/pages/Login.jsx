import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpData, setOtpData] = useState({ otp: "", trustDevice: false });
  const [step, setStep] = useState("credentials"); // 'credentials' or '2fa'
  const [tempUserId, setTempUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const nav = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setOtpData({ ...otpData, [e.target.name]: val });
  };

  const finishLogin = (data) => {
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userSahakari", data.sahakari);

    if (data.role === "member") nav("/home");
    else if (data.role === "admin") nav("/admin");
    else if (data.role === "superadmin") nav("/superadmin");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsPending(false);

    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "2FA_REQUIRED") {
        setTempUserId(data.userId);
        setStep("2fa");
        setErrorMessage(""); 
        return;
      }

      if (!data.success) {
        if (data.status === "Pending") setIsPending(true);
        setErrorMessage(data.message);
        return;
      }

      finishLogin(data);

    } catch {
      setErrorMessage("Could not connect to the server.");
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: tempUserId,
          otp: otpData.otp,
          trustDevice: otpData.trustDevice
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setErrorMessage(data.message || "Invalid OTP");
        return;
      }

      finishLogin(data);

    } catch {
      setErrorMessage("Verification failed.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex relative items-center px-20 bg-gradient-to-br from-[#00FFB2] via-black-600 to-black text-white overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <p className="uppercase tracking-widest text-sm text-white/70 mb-6">
            Finance Management Platform
          </p>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight mb-6">
            Built for clarity. <br />
            Designed for control.
          </h1>

          <p className="text-lg text-white/80 leading-relaxed">
            Manage members, track transactions, and view analytics with
            confidence — all from a single, intuitive dashboard.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            {step === "credentials" ? "Log in" : "Verify Identity"}
          </h2>
          <p className="text-gray-500 mb-8">
            {step === "credentials" 
              ? "Welcome back, please enter your details" 
              : "Enter the code sent to your email address"}
          </p>

          {step === "credentials" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  name="email"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                </div>
                <NavLink to="/forgot" className="text-gray-500 hover:text-gray-900">
                  Forgot password?
                </NavLink>
              </div>

              {errorMessage && (
                <div className={`rounded-lg p-4 text-sm ${
                  isPending ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {errorMessage}
                </div>
              )}

              <button type="submit" className="w-full py-3 rounded-lg bg-[#00FFB2] text-black font-semibold hover:bg-[#00e6a0] transition">
                Sign in
              </button>
            </form>
          )}

          {/* 2FA */}
          {step === "2fa" && (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  name="otp"
                  maxLength="6"
                  placeholder="000000"
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none text-center text-2xl tracking-widest font-bold"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  name="trustDevice"
                  id="trustDevice"
                  checked={otpData.trustDevice}
                  onChange={handleOtpChange}
                  className="w-5 h-5 accent-[#00FFB2]"
                />
                <label htmlFor="trustDevice" className="text-sm text-gray-700 cursor-pointer">
                  Trust this device for 30 days
                </label>
              </div>

              {errorMessage && (
                <div className="rounded-lg p-4 text-sm bg-red-50 text-red-600 border border-red-200">
                  {errorMessage}
                </div>
              )}

              <button type="submit" className="w-full py-3 rounded-lg bg-[#00FFB2] text-black font-semibold hover:bg-[#00e6a0] transition">
                Verify Code
              </button>

              <button 
                type="button" 
                onClick={() => setStep("credentials")}
                className="w-full text-sm text-gray-500 hover:text-gray-900 mt-2"
              >
                Back to Login
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <NavLink to="/signup" className="font-medium text-[#00FFB2]">
              Sign up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}