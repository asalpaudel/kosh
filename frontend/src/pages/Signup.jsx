import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!fullname || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Handle successful submission (e.g., show a message)
    alert(`Account creation for ${fullname} submitted!`);
    console.log("Form data:", { fullname, email, password });

    // Reset form
    setEmail("");
    setPassword("");
    setFullname("");
    setConfirmPassword("");
  };

  return (
    <div className="flex p-5 min-h-screen justify-center items-center box-border bg-gray-100">
      {/* Signup Form Column */}
      <div className="flex-1 max-w-lg bg-white rounded-lg p-8 shadow-lg flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Create an Account
        </h2>

        <form
          className="flex flex-col gap-5 w-full mx-auto"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="block font-semibold mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={fullname}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
              onChange={(e) => {
                setFullname(e.target.value);
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block font-semibold mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              required
              className="w-full mb-8 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full bg-[#3AC249] text-white font-bold py-3 rounded-full hover:bg-[#33b040] transition-colors"
          >
            Continue
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-10 text-center font-semibold">
          Already have an account?{" "}
          <NavLink to="/" className="text-[#3AC249]">
            Login
          </NavLink>
        </p>
      </div>
    </div>
  );
}