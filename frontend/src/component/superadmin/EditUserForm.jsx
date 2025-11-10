import React, { useState } from "react";

export default function EditUserForm({ 
  initialData, 
  onClose, 
  onUserUpdated, 
  apiBase = "http://localhost:8080/api" 
}) {
  const [formData, setFormData] = useState({
    id: initialData.id,
    name: initialData.name ?? "",
    email: initialData.email ?? "",
    phone: initialData.phone ?? "",
    role: initialData.role ?? "",
    sahakari: initialData.sahakari ?? "",
    password: "", // Leave empty - only update if user enters new password
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Prepare payload - only include password if user entered a new one
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        sahakari: formData.sahakari,
      };

      // Only include password if user wants to change it
      if (formData.password.trim()) {
        payload.password = formData.password;
      } else {
        // Keep existing password from backend
        payload.password = initialData.password;
      }

      console.log("Updating user:", formData.id);
      console.log("Payload:", payload);

      const res = await fetch(`${apiBase}/users/${formData.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      console.log("HTTP Status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Error response:", text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const saved = await res.json();
      console.log("Updated user:", saved);

      onUserUpdated?.(saved);
      onClose?.();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input 
          name="name" 
          onChange={onChange} 
          value={formData.name} 
          placeholder="Full Name" 
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none" 
          required 
        />
        
        <input 
          type="email"
          name="email" 
          onChange={onChange} 
          value={formData.email} 
          placeholder="Email Address" 
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none" 
          required 
        />
        
        <input 
          type="tel"
          name="phone" 
          onChange={onChange} 
          value={formData.phone} 
          placeholder="Phone Number" 
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none" 
        />
        
        <select
          name="role"
          onChange={onChange}
          value={formData.role}
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          required
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
          <option value="member">Member</option>
        </select>
        
        <input 
          name="sahakari" 
          onChange={onChange} 
          value={formData.sahakari} 
          placeholder="Associated Sahakari" 
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none" 
          required
        />
        
        <input 
          type="password"
          name="password" 
          onChange={onChange} 
          value={formData.password} 
          placeholder="New Password (leave empty to keep current)" 
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none" 
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <p className="text-xs text-gray-500">
        Note: Leave password field empty to keep the current password.
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={saving} 
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? "Updating..." : "Update User"}
        </button>
      </div>
    </form>
  );
}