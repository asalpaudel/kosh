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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${apiBase}/finance/fixed-deposits/${networkId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <DocumentTextIcon className="w-16 h-16 text-teal-500" />
      </div>
      <input
        name="name"
        onChange={handleChange}
        placeholder="Package name"
        required
      />
      <input
        name="interestRate"
        type="number"
        step="0.01"
        onChange={handleChange}
        placeholder="Interest Rate (%)"
        required
      />
      <input
        name="minDuration"
        type="number"
        onChange={handleChange}
        placeholder="Min. Duration (Months)"
        required
      />
      <input
        name="minAmount"
        type="number"
        onChange={handleChange}
        placeholder="Min. Amount (Rs.)"
      />
      <button
        type="submit"
        className="bg-teal-500 text-white py-2 rounded-full hover:bg-teal-600"
      >
        Add Fixed Deposit
      </button>
    </form>
  );
}

export default AddFixedDepositForm;
