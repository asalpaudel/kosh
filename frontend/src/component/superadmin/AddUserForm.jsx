import React, { useState, useEffect } from "react";
import { UserCircleIcon } from "../icons";

const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center w-full mb-4">
    <div
      className={`flex flex-col items-center ${currentStep >= 1 ? "text-teal-500" : "text-gray-400"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 1 ? "border-teal-500" : "border-gray-400"
          }`}
      >
        1
      </div>
      <span className="text-xs font-semibold mt-1">Details</span>
    </div>

    <div
      className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? "bg-teal-500" : "bg-gray-300"
        }`}
    ></div>

    <div
      className={`flex flex-col items-center ${currentStep >= 2 ? "text-teal-500" : "text-gray-400"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 2 ? "border-teal-500" : "border-gray-400"
          }`}
      >
        2
      </div>
      <span className="text-xs font-semibold mt-1">Photo</span>
    </div>
  </div>
);

export default function AddUserForm({
  onClose,
  onUserAdded,
  apiBase = "http://localhost:8080/api",
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    sahakari: "",
    password: "",
    photo: null,
  });

  const [sahakariList, setSahakariList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch sahakari (networks) from backend
  useEffect(() => {
    const fetchSahakaris = async () => {
      try {
        const res = await fetch(`${apiBase}/networks`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSahakariList(data);
      } catch (err) {
        console.error("Failed to load sahakari:", err);
        setError("Could not load sahakari list.");
      } finally {
        setLoading(false);
      }
    };

    fetchSahakaris();
  }, [apiBase]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const { name, email, phone, dob, address, sahakari, password, photo } = formData;

    if (!name || !email || !phone || !dob || !address || !sahakari || !password) {
      setError("Please fill in all required fields in Step 1.");
      return;
    }

    if (!photo) {
      setError("Please upload admin's photo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("dob", formData.dob);
      form.append("address", formData.address);
      form.append("role", "admin");
      form.append("sahakari", formData.sahakari);
      form.append("password", formData.password);
      form.append("status", "Active");

      // For admins, the backend might expect 'document' instead of 'photo'
      if (formData.photo) {
        form.append("photo", formData.photo);
      }

      // Debug logging
      console.log("=== SENDING ADMIN DATA ===");
      console.log("API Base:", apiBase);
      console.log("FormData contents:");
      for (let [key, value] of form.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      console.log("========================");

      // Clean the apiBase to ensure no trailing slashes or extra characters
      const cleanApiBase = apiBase.replace(/\/+$/, '');
      const endpoint = `${cleanApiBase}/users`;

      console.log("Full endpoint URL:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) {
        let errorMessage;
        const contentType = res.headers.get("content-type");

        console.error("Response status:", res.status);
        console.error("Response headers:", [...res.headers.entries()]);

        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          console.error("Error data:", errorData);
          errorMessage = errorData.error || errorData.message || `HTTP ${res.status}: Unknown error`;
        } else {
          const text = await res.text();
          console.error("Error text:", text);
          errorMessage = `HTTP ${res.status}: ${text || 'Bad Request'}`;
        }

        throw new Error(errorMessage);
      }

      const saved = await res.json();
      console.log("=== RECEIVED RESPONSE ===");
      console.log("Saved admin:", saved);
      console.log("Admin status:", saved.status);
      console.log("========================");

      onUserAdded?.(saved);
      alert(`Admin "${saved.name}" added successfully to ${formData.sahakari}!\n\nThe account is now active and the admin can log in immediately.`);
      onClose?.();
    } catch (err) {
      console.error("Error adding admin:", err);

      let displayError = err.message;

      if (err.message.includes("admin limit")) {
        displayError = err.message;
      } else if (err.message.includes("Network not found")) {
        displayError = "The selected sahakari network was not found.";
      }

      setError(displayError);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.sahakari || !formData.password) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    setError("");
    if (step < 2) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setError("");
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Get selected network info to show admin limit
  const selectedNetwork = sahakariList.find(
    (net) => net.name === formData.sahakari
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      <Stepper currentStep={step} />

      {/* Step 1: Admin Details */}
      {step === 1 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            Admin Details
          </h3>

          <div>
            <label className="block font-semibold mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter admin's full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin's email"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="98XXXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter admin's full address"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Select Sahakari <span className="text-red-500">*</span>
            </label>
            <select
              name="sahakari"
              value={formData.sahakari}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            >
              <option value="">Choose Sahakari</option>
              {sahakariList.map((net) => (
                <option key={net.id} value={net.name}>
                  {net.name} (Admin Limit: {net.adminLimit || "N/A"})
                </option>
              ))}
            </select>

            {selectedNetwork && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold text-blue-900">
                  {selectedNetwork.name}
                </p>
                <p className="text-blue-700">
                  Admin Limit: {selectedNetwork.adminLimit || "Unlimited"} |
                  User Limit: {selectedNetwork.userLimit || "Unlimited"}
                </p>
                <p className="text-blue-600">
                  Package: {selectedNetwork.packageType}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a temporary password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
            <p className="text-xs text-gray-500 mt-1 px-2">
              Admin can change this password after first login
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> This account will be immediately active. The admin can log in right away.
            </p>
          </div>
        </>
      )}

      {/* Step 2: Photo */}
      {step === 2 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            Admin Photo
          </h3>

          <div>
            <label className="block font-semibold mb-2">
              Admin's Photo (Image) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="photo"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
            {formData.photo && (
              <p className="text-xs text-green-600 mt-1 px-2">
                ✓ {formData.photo.name}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center -mt-2">
            <span className="text-red-500">*</span> Photo is required for admin profile
          </p>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            disabled={saving}
            className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-black text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        ) : null}

        {step === 2 ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Add Admin"}
          </button>
        ) : null}
      </div>
    </div>
  );
}