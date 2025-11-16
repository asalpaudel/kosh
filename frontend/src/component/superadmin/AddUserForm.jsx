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
    role: "member",
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
      form.append("role", formData.role);
      form.append("sahakari", formData.sahakari);
      form.append("password", formData.password);

      // ⭐⭐⭐ CRITICAL: Set status to Active for admin-created users
      form.append("status", "Active");

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
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
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
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Role + Sahakari */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role */}
        <div>
          <label className="block font-semibold mb-2">Select Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          >
            <option value="member">Member</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
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
                {net.name}
              </option>
            ))}
          </select>
        </div>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        {saving ? "Saving..." : "Add User"}
      </button>
    </form>
  );
}
