import { NavLink, useNavigate } from "react-router-dom";
import lImage from "../Resources/Login.png";
import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");

  const nav = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8080/api/users/register", {
        email: email,
        password: password,
        name: fullname,
        phone: phone,         // optional
        country: country,     // optional
        state: state,         // optional
        type: "free"          // default type
      });

      console.log("Saved user:", res.data);
      alert(`User ${res.data.name} registered successfully!`);

      // Reset form
      setEmail("");
      setPassword("");
      setFullname("");
      setPhone("");
      setCountry("");
      setState("");

      nav("/"); // redirect after successful registration

    } catch (error) {
      if (error.response) {
        alert(`Registration failed: ${error.response.data}`);
      } else {
        alert("Registration failed! Please try again.");
      }
      console.error("Error registering user:", error);
    }
};


  return (
    <div className="flex flex-wrap gap-5 p-5 min-h-screen box-border">
      {/* Left Column */}
      <div className="hidden md:flex flex-1 min-w-[280px] bg-white rounded-lg p-5 justify-center items-center">
        <img
          src={lImage}
          alt="Login Visual"
          className="max-w-full max-h-[700px] object-contain"
        />
      </div>

      {/* Right Column */}
      <div className="flex-1 min-w-[280px] bg-white rounded-lg p-5 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Create an Account
        </h2>

        <form
          className="flex flex-col gap-5 w-full max-w-md mx-auto"
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
              className="w-full mb-8 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
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
