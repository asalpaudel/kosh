import React, { useState } from "react";
import { DocumentTextIcon } from "../icons";

const apiBase = "http://localhost:8080/api";

function AddFixedDepositForm({ onAdded, onClose, networkId }) {
  const [formData, setFormData] = useState({
    name: "",
    interestRate: "",
    minDuration: "",
    minAmount: "",
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

    console.log("Form Data:", formData);
    console.log("Network ID:", networkId);
    console.log("URL:", `${apiBase}/finance/fixed-deposits/${networkId}`);

    try {
      const response = await fetch(
        `${apiBase}/finance/fixed-deposits/${networkId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
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
        <DocumentTextIcon className="w-16 h-16 text-teal-500" />
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Package name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Interest Rate (%)</label>
        <input
          name="interestRate"
          type="number"
          step="0.01"
          value={formData.interestRate}
          onChange={handleChange}
          placeholder="Interest Rate (%)"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Min. Duration (Months)
        </label>
        <input
          name="minDuration"
          type="number"
          value={formData.minDuration}
          onChange={handleChange}
          placeholder="Min. Duration (Months)"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Min. Amount (Rs.)</label>
        <input
          name="minAmount"
          type="number"
          value={formData.minAmount}
          onChange={handleChange}
          placeholder="Min. Amount (Rs.)"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`bg-teal-500 text-white py-3 rounded-full hover:bg-teal-600 font-semibold ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Adding..." : "Add Fixed Deposit"}
      </button>
    </form>
  );
}

export default AddFixedDepositForm;
