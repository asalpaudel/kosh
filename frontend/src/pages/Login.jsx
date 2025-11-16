import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const nav = useNavigate();

  // LOGIN HANDLER (Updated with pending user check)
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login Response:", data);

      if (!data.success) {
        // ⭐ Check if user is pending
        if (data.status === "Pending") {
          setIsPending(true);
        }
        setErrorMessage(data.message);
        return;
      }

      // Login successful
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userSahakari", data.sahakari);

      // Navigate based on role
      if (data.role === "member") {
        nav("/home");
      } else if (data.role === "admin") {
        nav("/admin");
      } else if (data.role === "superadmin") {
        nav("/superadmin");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage(
        "Could not connect to the server. Please try again later."
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Left panel */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
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

      {/* Right panel */}
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

            {/* Error/Status Message */}
            {errorMessage && (
              <div
                className={`p-4 rounded-lg ${
                  isPending
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={`text-center font-medium ${
                    isPending ? "text-yellow-700" : "text-red-600"
                  }`}
                >
                  {isPending && (
                    <svg
                      className="inline w-5 h-5 mr-2 -mt-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {errorMessage}
                </p>
                {isPending && (
                  <p className="text-center text-sm text-yellow-600 mt-2">
                    Your account will be activated once an administrator reviews
                    your registration.
                  </p>
                )}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-[#00FFB2] text-black font-semibold py-3 rounded-full hover:bg-[#00e6a0] transition-colors"
            >
              Signin
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center font-medium">
            Don't have an account?{" "}
            <NavLink to="/signup" className="text-[#00FFB2] hover:underline">
              Signup
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
