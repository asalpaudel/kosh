import React, { useState } from "react";

const apiBase = "http://localhost:8080/api";

export default function EditSavingAccountForm({ initialData, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    id: initialData.id,
    name: initialData.name ?? "",
    interestRate: initialData.interestRate ?? "",
    minBalance: initialData.minBalance ?? "",
    description: initialData.description ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        interestRate: parseFloat(formData.interestRate),
        minBalance: parseFloat(formData.minBalance),
        description: formData.description,
      };

      const res = await fetch(`${apiBase}/finance/saving-accounts/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onUpdated?.(saved);
      onClose?.();
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Package Name */}
      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter package name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Interest Rate and Min Balance in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            name="interestRate"
            value={formData.interestRate}
            onChange={handleChange}
            placeholder="e.g., 5.5"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Minimum Balance</label>
          <input
            type="number"
            step="0.01"
            name="minBalance"
            value={formData.minBalance}
            onChange={handleChange}
            placeholder="e.g., 5000"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter package description (optional)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {saving ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
}