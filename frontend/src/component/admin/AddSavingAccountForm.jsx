import React, { useState } from "react";
import { CurrencyDollarIcon } from "../icons";

const apiBase = "http://localhost:8080/api";

function AddSavingAccountForm({ onAdded, onClose, networkId }) {
  const [formData, setFormData] = useState({
    name: "",
    interestRate: "",
    minBalance: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBase}/finance/saving-accounts/${networkId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Success! Response data:", data);

      onAdded();
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Package Name */}
      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
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
            name="interestRate"
            type="number"
            step="0.01"
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
            name="minBalance"
            type="number"
            step="0.01"
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
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Saving Account"}
      </button>
    </form>
  );
}

export default AddSavingAccountForm;