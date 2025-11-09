import React, { useState } from 'react';
import { UserCircleIcon } from '../icons';

// Mock list of sahakaris, this would likely come from an API
const sahakariList = [
  "Sahakari 1",
  "Sahakari 2",
  "Geda Sahakari",
  "Janata Sahakari",
];

function AddUserForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    sahakari: '',
    password: '',
    document: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Prepare the user data (excluding the document for now)
  const userData = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    role: formData.role,
    sahakari: formData.sahakari,
    password: formData.password,
    documentPath: formData.document ? formData.document.name : null, // optional
  };

  try {
    const response = await fetch("http://localhost:8080/api/users/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const data = await response.json();
      alert(`User "${data.name}" added successfully!`);
      onClose(); // Close the modal
    } else {
      alert("Error adding user. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to connect to the backend.");
  }
};


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-semibold mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter user's full name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block font-semibold mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter user's email"
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
          placeholder="98XXXXXXXX"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
        />
      </div>

      {/* Role and Sahakari (in one row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Dropdown */}
        <div>
          <label className="block font-semibold mb-2">Select Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          >
            <option value="member">Member</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Sahakari Dropdown */}
        <div>
          <label className="block font-semibold mb-2">Select Sahakari</label>
          <select
            name="sahakari"
            value={formData.sahakari}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          >
            <option value="">Choose Sahakari</option>
            {sahakariList.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block font-semibold mb-2">Temporary Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter a temporary password"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Document Upload */}
      <div>
        <label className="block font-semibold mb-2">
          Upload User Document (PDF / Image)
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
        Add User
      </button>
    </form>
  );
}

export default AddUserForm;