import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const nav = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      alert("Welcome back!");
      nav("/home");
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Left Panel */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        {/* Top-right Logo */}
        <div className="absolute top-4 right-4 bg-black p-2 rounded-lg border border-[#00FFB2]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="#00FFB2"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>

        {/* Dollar Symbol Art */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="w-3/4 max-w-[300px]"
        >
          <path
            d="M20 80 Q50 20 80 80 M40 65 L70 65 M45 45 L45 65 M55 45 L55 65"
            stroke="#00FFB2"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="50" y="90" fill="#00FFB2" fontSize="14" textAnchor="middle">
            $
          </text>
        </svg>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6">
            Hello,
            <br />
            Welcome Back
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="block font-semibold mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-[#00FFB2]"
                />
                Remember me
              </label>
              <NavLink to="/forgot" className="text-gray-500 hover:text-black">
                Forgot Password?
              </NavLink>
            </div>

            {/* Signin Button */}
            <button
              type="submit"
              className="w-full bg-[#00FFB2] text-black font-semibold py-3 rounded-full hover:bg-[#00e6a0] transition-colors"
            >
              Signin
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center font-medium">
            Don’t have an account?{" "}
            <NavLink to="/signup" className="text-[#00FFB2] hover:underline">
              Signup
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
