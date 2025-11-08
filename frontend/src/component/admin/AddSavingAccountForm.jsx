import React, { useState } from 'react';
import { CurrencyDollarIcon } from '../icons'; 

function AddSavingAccountForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    interestRate: '',
    minBalance: '',
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
    console.log('New Saving Account Package:', formData);
    alert(`Package "${formData.name}" created!`);
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />
      </div>

      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., General Savings"
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
            placeholder="e.g., 4.5"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Min. Balance (Rs.)</label>
          <input
            type="number"
            name="minBalance"
            value={formData.minBalance}
            onChange={handleChange}
            placeholder="e.g., 1000"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          />
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Add Saving Package
      </button>
    </form>
  );
}

export default AddSavingAccountForm;