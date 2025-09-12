import lImage from "../Resources/Login.png";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(true);

  const handleLogin = () => {
    if (email === "" || password === "") {
      setHidden(false);
    } else {
      setHidden(true);
      console.log("Logging in with:", { email, password });
      // Just a placeholder — no backend
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen p-5 gap-5">
      {/* Left Column */}
      <div className="hidden md:flex flex-1 min-w-[280px] bg-white rounded-lg p-5 justify-center items-center">
        <img
          src={lImage}
          alt="Login Visual"
          className="max-w-full max-h-[700px] object-contain"
        />
      </div>

      {/* Right Column */}
      <div className="flex-1 bg-white rounded-lg p-5 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Hello,
          <br />
          Welcome Back
        </h2>

        <form className="flex flex-col gap-5 w-full max-w-md mx-auto">
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
              {!hidden && email === "" && (
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
              {!hidden && password === "" && (
                <div className="absolute right-3 top-3 text-sm text-red-500">
                  Required
                </div>
              )}
            </div>
          </div>

          {/* Signin Button */}
          <button
            type="button"
            className="w-full bg-[#3AC249] text-white font-bold py-3 rounded-full hover:bg-[#33b040] transition-colors"
            onClick={handleLogin}
          >
            Signin
          </button>
        </form>
      </div>
    </div>
  );
}
