import React, { useState } from "react";
import { BanknotesIcon } from "../icons";

const apiBase = "http://localhost:8080/api";

function AddLoanForm({ onAdded, onClose, networkId }) {
  const [formData, setFormData] = useState({
    name: "",
    interestRate: "",
    maxAmount: "",
    maxDuration: "",
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
        `${apiBase}/finance/loan-packages/${networkId}`,
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
        <BanknotesIcon className="w-16 h-16 text-teal-500" />
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

      {/* Interest Rate and Max Duration in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Interest Rate (%)</label>
          <input
            name="interestRate"
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={handleChange}
            placeholder="e.g., 12.5"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Maximum Duration (months)
          </label>
          <input
            name="maxDuration"
            type="number"
            value={formData.maxDuration}
            onChange={handleChange}
            placeholder="e.g., 60"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
      </div>

      {/* Maximum Amount */}
      <div>
        <label className="block font-semibold mb-2">Maximum Amount</label>
        <input
          name="maxAmount"
          type="number"
          step="0.01"
          value={formData.maxAmount}
          onChange={handleChange}
          placeholder="e.g., 500000"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
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
        {loading ? "Adding..." : "Add Loan Package"}
      </button>
    </form>
  );
}

export default AddLoanForm;