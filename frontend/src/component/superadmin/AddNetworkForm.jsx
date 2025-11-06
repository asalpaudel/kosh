import React, { useState } from 'react';
import { BuildingIcon, PhoneIcon, DocumentIcon } from '../icons';

function AddNetworkForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    document: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic (e.g., API call)
    console.log('New Network Data:', formData);
    alert(`Sahakari "${formData.name}" created!`);
    onClose(); // Close the modal on submit
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <BuildingIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* Sahakari Name */}
      <div>
        <label className="block font-semibold mb-2">Sahakari Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter the official sahakari name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Address */}
      <div>
        <label className="block font-semibold mb-2">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter the primary office address"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block font-semibold mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter office contact number"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Document Upload */}
      <div>
        <label className="block font-semibold mb-2">
          Upload Registration Document (PDF / Image)
        </label>
        <input
          type="file"
          name="document"
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Add Sahakari
      </button>
    </form>
  );
}

export default AddNetworkForm;