import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    setSubmitted(true);

    if (email && password) {
      console.log("Logging in with:", { email, password });
      alert("Login successful!");
      // Here you would typically handle actual login logic
    }
  };

  return (
    <div className="flex p-5 min-h-screen justify-center items-center box-border bg-gray-100">
      {/* Login Form Column */}
      <div className="flex-1 max-w-lg bg-white rounded-lg p-8 shadow-lg flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Hello,
          <br />
          Welcome Back
        </h2>

        <form
          className="flex flex-col gap-5 w-full max-w-md mx-auto"
          onSubmit={handleLogin}
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-semibold mb-2">
              Email
            </label>
            <div className="relative w-full">
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500 pr-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {submitted && !email && (
                <div className="absolute right-3 top-3 text-sm text-red-500">
                  Required
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block font-semibold mb-2">
              Password
            </label>
            <div className="relative w-full">
              <input
                type="password"
                id="password"
                name="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {submitted && !password && (
                <div className="absolute right-3 top-3 text-sm text-red-500">
                  Required
                </div>
              )}
            </div>
          </div>

          {/* Signin Button */}
          <button
            type="submit"
            className="w-full mt-4 bg-[#3AC249] text-white font-bold py-3 rounded-full hover:bg-[#33b040] transition-colors"
          >
            Sign In
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-10 text-center font-semibold">
          Don't have an account?{" "}
          <NavLink to="/signup" className="text-[#3AC249]">
            Sign Up
          </NavLink>
        </p>
      </div>
    </div>
  );
}