import React, { useState, useEffect } from "react";
import { UserCircleIcon } from "../icons";

const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center w-full mb-4">
    <div
      className={`flex flex-col items-center ${
        currentStep >= 1 ? "text-teal-500" : "text-gray-400"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
          currentStep >= 1 ? "border-teal-500" : "border-gray-400"
        }`}
      >
        1
      </div>
      <span className="text-xs font-semibold mt-1">Details</span>
    </div>

    <div
      className={`flex-1 h-1 mx-2 ${
        currentStep >= 2 ? "bg-teal-500" : "bg-gray-300"
      }`}
    ></div>

    <div
      className={`flex flex-col items-center ${
        currentStep >= 2 ? "text-teal-500" : "text-gray-400"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
          currentStep >= 2 ? "border-teal-500" : "border-gray-400"
        }`}
      >
        2
      </div>
      <span className="text-xs font-semibold mt-1">Documents</span>
    </div>
  </div>
);

function AddUserForm({ onClose, onUserAdded, apiBase = "http://localhost:8080/api" }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member",
    password: "",
    photo: null,
    citizenship: null,
    signature: null,
  });

  const [adminSahakari, setAdminSahakari] = useState(null);
  const [loadingSahakari, setLoadingSahakari] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ⭐ Fetch admin's sahakari from session
  useEffect(() => {
    const fetchAdminSahakari = async () => {
      try {
        const res = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          
          // Clean the sahakariId
          let cleanId = String(data.sahakariId).replace(/[^0-9]/g, '');
          
          // Get network name
          const networkRes = await fetch(`${apiBase}/networks/${cleanId}`, {
            credentials: "include",
          });

          if (networkRes.ok) {
            const networkData = await networkRes.json();
            setAdminSahakari(networkData.name);
            console.log("Admin's Sahakari for form:", networkData.name);
          } else {
            setError("Failed to load sahakari information");
          }
        } else {
          setError("Failed to load session");
        }
      } catch (err) {
        console.error("Failed to load admin sahakari:", err);
        setError("Could not load sahakari information.");
      } finally {
        setLoadingSahakari(false);
      }
    };

    fetchAdminSahakari();
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
    
    if (!adminSahakari) {
      setError("Sahakari information not loaded. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", formData.role);
      form.append("sahakari", adminSahakari); // ⭐ Use admin's sahakari
      form.append("password", formData.password);
      
      // Admin-created users are immediately Active
      form.append("status", "Active");

      // Upload documents
      if (formData.citizenship) {
        form.append("document", formData.citizenship);
      } else if (formData.photo) {
        form.append("document", formData.photo);
      } else if (formData.signature) {
        form.append("document", formData.signature);
      }

      const res = await fetch(`${apiBase}/users`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const saved = await res.json();
      console.log("Saved user:", saved);

      onUserAdded?.(saved);
      alert(`User "${saved.name}" added successfully to ${adminSahakari}!`);
      onClose?.();
    } catch (err) {
      console.error("Error adding user:", err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
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

  if (loadingSahakari) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!adminSahakari) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-red-500">Unable to load sahakari. Please try again.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      <Stepper currentStep={step} />

      {step === 1 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            User Details
          </h3>
          
          {/* Show which Sahakari this user will be added to */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
            <p className="text-sm text-teal-700">
              <span className="font-semibold">Adding user to:</span> {adminSahakari}
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter user's full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              required
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
              placeholder="Enter user's email"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              required
            />
          </div>

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
              required
            />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">
            User Documents
          </h3>
          <div>
            <label className="block font-semibold mb-2">
              User's Photo (Image)
            </label>
            <input
              type="file"
              name="photo"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Citizenship (PDF / Image)
            </label>
            <input
              type="file"
              name="citizenship"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              User's Signature (Image)
            </label>
            <input
              type="file"
              name="signature"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
            type="submit"
            disabled={saving}
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add User"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default AddUserForm;