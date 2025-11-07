import React, { useState } from "react";

export default function AddNetworkForm({
  onClose,
  onNetworkAdded,
  apiBase = "http://localhost:8080/api",
}) {
  const [formData, setFormData] = useState({
    registeredId: "",
    name: "",
    address: "",
    createdAt: "",
    phone: "",
    staffCount: "",
    userCount: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Prepare payload with proper number conversion
      const payload = {
        registeredId: formData.registeredId,
        name: formData.name,
        address: formData.address || null,
        createdAt: formData.createdAt || null,
        phone: formData.phone || null,
        staffCount: formData.staffCount ? parseInt(formData.staffCount, 10) : null,
        userCount: formData.userCount ? parseInt(formData.userCount, 10) : null,
      };

      const url = `${apiBase}/networks`;

      console.log("Submitting to:", url);
      console.log("Payload:", payload);

      const res = await fetch(url, {
        method: "POST",
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
      console.log("Saved network:", saved);

      onNetworkAdded?.(saved);
      onClose?.();
    } catch (err) {
      console.error("Error adding network:", err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="registeredId"
          onChange={onChange}
          value={formData.registeredId}
          placeholder="Registered ID"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          required
        />
        <input
          name="name"
          onChange={onChange}
          value={formData.name}
          placeholder="Name"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          required
        />
        <input
          name="address"
          onChange={onChange}
          value={formData.address}
          placeholder="Address"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
        <input
          name="createdAt"
          onChange={onChange}
          value={formData.createdAt}
          placeholder="Created At (e.g., 13-Nov-2025)"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
        <input
          name="phone"
          onChange={onChange}
          value={formData.phone}
          placeholder="Phone"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
        <input
          type="number"
          name="staffCount"
          onChange={onChange}
          value={formData.staffCount}
          placeholder="Staff Count"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          min="0"
        />
        <input
          type="number"
          name="userCount"
          onChange={onChange}
          value={formData.userCount}
          placeholder="User Count"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          min="0"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
          {saving ? "Saving..." : "Add Network"}
        </button>
      </div>
    </form>
  );
}