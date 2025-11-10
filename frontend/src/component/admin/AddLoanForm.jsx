import React, { useState } from 'react';
import { BanknotesIcon } from '../icons'; 

function AddLoanForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    interestRate: '',
    maxAmount: '',
    maxDuration: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New Loan Package:', formData);
    alert(`Package "${formData.name}" created!`);
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <BanknotesIcon className="w-16 h-16 text-teal-500" />
      </div>

      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Personal Loan"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            name="interestRate"
            value={formData.interestRate}
            onChange={handleChange}
            placeholder="e.g., 12.0"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Max. Duration (Months)</label>
          <input
            type="number"
            name="maxDuration"
            value={formData.maxDuration}
            onChange={handleChange}
            placeholder="e.g., 60"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          />
        </div>
      </div>
      
      <div>
        <label className="block font-semibold mb-2">Maximum Amount (Rs.)</label>
        <input
          type="number"
          name="maxAmount"
          value={formData.maxAmount}
          onChange={handleChange}
          placeholder="e.g., 500000"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Add Loan Package
      </button>
    </form>
  );
}

export default AddLoanForm;