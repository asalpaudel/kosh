import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsPending(false);

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.status === "Pending") setIsPending(true);
        setErrorMessage(data.message);
        return;
      }

      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userSahakari", data.sahakari);

      if (data.role === "member") nav("/home");
      else if (data.role === "admin") nav("/admin");
      else if (data.role === "superadmin") nav("/superadmin");
    } catch {
      setErrorMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT — SOLID COLOR / TYPOGRAPHY */}
      <div className="hidden lg:flex relative items-center px-20 bg-gradient-to-br from-[#00FFB2] via-black-600 to-black text-white overflow-hidden">
        {/* Decorative blur */}
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

      {/* RIGHT — FORM */}
      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Log in</h2>
          <p className="text-gray-500 mb-8">
            Welcome back, please enter your details
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00FFB2] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-[#00FFB2]"
                />
                Remember me
              </label>

              <NavLink
                to="/forgot"
                className="text-gray-500 hover:text-gray-900"
              >
                Forgot password?
              </NavLink>
            </div>

            {/* Status */}
            {errorMessage && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  isPending
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {errorMessage}
                {isPending && (
                  <p className="mt-1 text-xs">
                    Account pending administrator approval.
                  </p>
                )}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#00FFB2] text-black font-semibold hover:bg-[#00e6a0] transition"
            >
              Sign in
            </button>
          </form>

          {/* Signup */}
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
