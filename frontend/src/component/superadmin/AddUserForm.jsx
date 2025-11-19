import React, { useState, useEffect } from "react";
import { UserCircleIcon } from "../icons";

export default function AddUserForm({
  onClose,
  onUserAdded,
  apiBase = "http://localhost:8080/api",
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sahakari: "",
    password: "",
    document: null,
  });

  const [sahakariList, setSahakariList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch sahakari (networks) from backend
  useEffect(() => {
    const fetchSahakaris = async () => {
      try {
        const res = await fetch(`${apiBase}/networks`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSahakariList(data);
      } catch (err) {
        console.error("Failed to load sahakari:", err);
        setError("Could not load sahakari list.");
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
    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", "admin"); // Always set role to admin
      form.append("sahakari", formData.sahakari);
      form.append("password", formData.password);
      form.append("status", "Active"); // Set status to Active for admin-created users

      if (formData.document) {
        form.append("document", formData.document);
      }

      // Debug logging
      console.log("=== SENDING USER DATA ===");
      console.log("FormData contents:");
      for (let [key, value] of form.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      console.log("========================");

      const res = await fetch(`${apiBase}/users`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        // Try to parse JSON error response
        let errorMessage;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP ${res.status}: Unknown error`;
        } else {
          const text = await res.text();
          errorMessage = `HTTP ${res.status}: ${text}`;
        }
        
        throw new Error(errorMessage);
      }

      const saved = await res.json();
      console.log("=== RECEIVED RESPONSE ===");
      console.log("Saved user:", saved);
      console.log("User status:", saved.status);
      console.log("========================");

      onUserAdded?.(saved);

      if (saved.status === "Active") {
        alert(`User "${saved.name}" added successfully and is now Active!`);
      } else {
        alert(`User "${saved.name}" added but status is: ${saved.status}`);
      }

      onClose?.();
    } catch (err) {
      console.error("Error adding user:", err);
      
      // Display user-friendly error message
      let displayError = err.message;
      
      // Check if it's an admin limit error
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

  // Get selected network info to show admin limit
  const selectedNetwork = sahakariList.find(
    (net) => net.name === formData.sahakari
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-semibold mb-2">Full Name</label>
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

      {/* Email */}
      <div>
        <label className="block font-semibold mb-2">Email</label>
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

      {/* Phone */}
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

      {/* Sahakari */}
      <div>
        <label className="block font-semibold mb-2">Select Sahakari</label>
        <select
          name="sahakari"
          value={formData.sahakari}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        >
          <option value="">Choose Sahakari</option>
          {sahakariList.map((net) => (
            <option key={net.id} value={net.name}>
              {net.name} (Admin Limit: {net.adminLimit || "N/A"})
            </option>
          ))}
        </select>
        
        {/* Show network info when selected */}
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

      {/* Password */}
      <div>
        <label className="block font-semibold mb-2">Temporary Password</label>
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

      {/* Document */}
      <div>
        <label className="block font-semibold mb-2">
          Upload User Document (PDF / Image)
        </label>
        <input
          type="file"
          name="document"
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Add Admin"}
      </button>
    </form>
  );
}