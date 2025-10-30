import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    address: "",
    phone: "",
    sahakari: "",
    password: "",
    confirm: "",
    document: null,
  });

  const sahakariList = [
    "Mahalaxmi Sahakari",
    "Siddhartha Sahakari",
    "Everest Sahakari",
    "Janata Sahakari",
    "Nawa Jeevan Sahakari",
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSignup = (e) => {
    e.preventDefault();

    const { name, email, password, confirm } = formData;
    if (!name || !email || !password || !confirm) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }
    alert(`Account created for ${name}!`);
  };

  return (
    // lock viewport height & prevent body scroll
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white">
      {/* Left Panel - fixed / non-scrolling */}
      <div className="flex-1 bg-black flex items-center justify-center relative min-h-full">
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

        {/* Dollar Symbol Art / Illustration */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="w-3/4 max-w-[320px] px-6"
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

      {/* Right Panel - scrollable inner container only */}
      <div className="flex-1 flex justify-center items-stretch">
        {/* The wrapper provides horizontal centering; the inner box handles scrolling */}
        <div
          className="w-full max-w-md mx-auto px-6
                     py-6
                     overflow-y-auto
                     scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100
                     rounded-none"
          // Constrain the inner scroll area so body doesn't scroll.
          style={{ maxHeight: "calc(100vh - 2rem)" }} // safe cross-browser
        >
          <div className="py-6">
            <h2 className="text-3xl font-bold mb-6">
              Create Account,
              <br />
              Join Us Today
            </h2>

            <form onSubmit={handleSignup} className="flex flex-col gap-5">
              {/* Full Name */}
              <div>
                <label className="block font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* ID (optional) */}
              <div>
                <label className="block font-semibold mb-2">ID</label>
                <input
                  type="text"
                  name="id"
                  placeholder="Enter ID"
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block font-semibold mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block font-semibold mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  min="0"
                  placeholder="Enter age"
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="98XXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Sahakari Dropdown */}
              <div>
                <label className="block font-semibold mb-2">
                  Select Sahakari
                </label>
                <select
                  name="sahakari"
                  value={formData.sahakari}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                >
                  <option value="">Choose your Sahakari</option>
                  {sahakariList.map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="block font-semibold mb-2">
                  Upload Document (PDF / Image)
                </label>
                <input
                  type="file"
                  name="document"
                  accept=".pdf, .png, .jpg, .jpeg"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#00FFB2] file:text-black file:font-semibold hover:file:bg-[#00e6a0] transition"
                />
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                className="w-full bg-[#00FFB2] text-black font-semibold py-3 rounded-full hover:bg-[#00e6a0] transition-colors"
              >
                Signup
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-6 text-center font-medium">
              Already have an account?{" "}
              <NavLink to="/login" className="text-[#00FFB2] hover:underline">
                Signin
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
