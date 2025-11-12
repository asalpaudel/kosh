import React, { useState } from "react";
import { CurrencyDollarIcon } from "../icons";

function AddSavingAccountForm({ onAdded, onClose, networkId }) {
  const [formData, setFormData] = useState({
    name: "",
    interestRate: "",
    minBalance: "",
  });

  const apiBase = "http://localhost:8080/api";
  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${apiBase}/finance/saving-accounts/${networkId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />
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
        name="minBalance"
        type="number"
        onChange={handleChange}
        placeholder="Min. Balance (Rs.)"
      />
      <button
        type="submit"
        className="bg-teal-500 text-white py-2 rounded-full hover:bg-teal-600"
      >
        Add Saving Account
      </button>
    </form>
  );
}

export default AddSavingAccountForm;
