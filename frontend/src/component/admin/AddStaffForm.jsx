import React, { useState } from 'react';
import { UserPlusIcon } from '../icons'; 

const sahakariList = [
  "Sahakari 1",
  "Sahakari 2",
  "Geda Sahakari",
  "Janata Sahakari",
];

/**
 * A form for Admins to add a new Staff member.
 * @param {object} props
 * @param {function} props.onClose 
 */
function AddStaffForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff', 
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('New Staff Data:', formData);
    alert(`Staff "${formData.name}" created!`);
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserPlusIcon className="w-16 h-16 text-teal-500" />
      </div>

      <div>
        <label className="block font-semibold mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter staff's full name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter staff's email"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>
      
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

      <div>
        <label className="block font-semibold mb-2">
          Upload Staff Document (PDF / Image)
        </label>
        <input
          type="file"
          name="document"
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Add Staff
      </button>
    </form>
  );
}

export default AddStaffForm;