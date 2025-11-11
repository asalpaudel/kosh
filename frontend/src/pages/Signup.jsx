import { NavLink } from "react-router-dom";
import { useState } from "react";

// --- Stepper UI Component ---
// (No changes needed in this component)
const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center w-full mb-4">
    {/* Step 1 */}
    <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 1 ? 'border-teal-500' : 'border-gray-400'}`}>
        1
      </div>
      <span className="text-xs font-semibold mt-1">Personal</span>
    </div>
    
    {/* Connector */}
    <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
    
    {/* Step 2 */}
    <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 2 ? 'border-teal-500' : 'border-gray-400'}`}>
        2
      </div>
      <span className="text-xs font-semibold mt-1">Account</span>
    </div>
    
    {/* Connector */}
    <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>

    {/* Step 3 */}
    <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 3 ? 'border-teal-500' : 'border-gray-400'}`}>
        3
      </div>
      <span className="text-xs font-semibold mt-1">Document</span>
    </div>
  </div>
);


export default function Signup() {
  const [step, setStep] = useState(1);
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

    // Final check, though 'nextStep' validation should catch most errors
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

  // --- Step Navigation ---
  const nextStep = () => {
    // Validate Step 1
    if (step === 1) {
      if (!formData.name || !formData.email) {
        alert('Please fill in your name and email.');
        return;
      }
    }
    
    // Validate Step 2
    if (step === 2) {
      if (!formData.sahakari || !formData.password || !formData.confirm) {
        alert('Please select your Sahakari and fill in your password.');
        return;
      }
      if (formData.password !== formData.confirm) {
        alert('Passwords do not match.');
        return;
      }
    }

    if (step < 3) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };


  return (
    // CHANGE 1: Apply h-screen/overflow-hidden ONLY on large screens (lg:)
    // This allows the page to scroll normally on mobile.
    <div className="flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-white">
      
      {/* CHANGE 2: Left Panel is now hidden on mobile (hidden) */}
      {/* and shown as a flex item on large screens (lg:flex) */}
      <div className="hidden lg:flex flex-1 bg-black items-center justify-center relative">
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

      {/* CHANGE 3: Right Panel now controls scrolling on desktop */}
      {/* On lg:, it's a fixed-height scrolling container. */}
      {/* On mobile, it's just a normal block that lets the page scroll. */}
      <div className="flex-1 lg:h-screen lg:overflow-y-auto 
                     scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        
        {/* CHANGE 4: This is now the main content wrapper. */}
        {/* Removed redundant wrapper and combined padding (py-12). */}
        <div className="w-full max-w-md mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold mb-6">
            Create Account,
            <br />
            Join Us Today
          </h2>
          
          <Stepper currentStep={step} />

          <form onSubmit={handleSignup} className="flex flex-col gap-5 mt-8">
            
            {/* --- Step 1: Personal Info --- */}
            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">Personal Information</h3>
                {/* Full Name */}
                <div>
                  <label className="block font-semibold mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold mb-2">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                    required
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
              </>
            )}

            {/* --- Step 2: Account Info --- */}
            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">Account Information</h3>
                {/* Sahakari Dropdown */}
                <div>
                  <label className="block font-semibold mb-2">
                    Select Sahakari <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sahakari"
                    value={formData.sahakari}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                    required
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
                  <label className="block font-semibold mb-2">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-semibold mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirm"
                    value={formData.confirm}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </>
            )}

            {/* --- Step 3: Document Upload --- */}
            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">Verification Document</h3>
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
                  <p className="text-xs text-gray-500 mt-2 px-2">e.g., A copy of your citizenship or other identifying document.</p>
                </div>
              </>
            )}


            {/* --- Navigation Buttons --- */}
            <div className="flex justify-between mt-6">
              {/* "Back" button */}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div></div> // Empty div to keep "Next" button on the right
              )}

              {/* "Next" button */}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-black text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              ) : null}

              {/* "Signup" button */}
              {step === 3 ? (
                <button
                  type="submit"
                  className="w-full bg-[#00FFB2] text-black font-semibold py-3 rounded-full hover:bg-[#00e6a0] transition-colors"
                >
                  Signup
                </button>
              ) : null}
            </div>

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
  );
}