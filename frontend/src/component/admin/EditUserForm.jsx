import React, { useState, useEffect } from 'react';

// Mock list of sahakaris, this would likely come from an API
const sahakariList = [
  "Sahakari 1",
  "Sahakari 2",
  "Geda Sahakari",
  "Janata Sahakari",
];

/**
 * A form to edit an existing user's details.
 * @param {object} props
 * @param {object} props.user - The user object to edit.
 * @param {function} props.onClose - Function to close the modal.
 */
function EditUserForm({ user, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    sahakari: '',
    status: 'Pending',
  });

  // Pre-fill the form when the 'user' prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'member',
        sahakari: user.sahakari || '',
        status: user.status || 'Pending',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic (e.g., API call)
    console.log(`Updating user ${user.id}:`, formData);
    alert(`User "${formData.name}" updated! (Mock)`);
    onClose(); // Close the modal on submit
  };

  if (!user) return null; // Don't render if no user is provided

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      {/* Role, Sahakari, and Status (in one row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Role Dropdown */}
        <div>
          <label className="block font-semibold mb-2">Role</label>
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
          <label className="block font-semibold mb-2">Sahakari</label>
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
        
        {/* Status Dropdown */}
        <div>
          <label className="block font-semibold mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          >
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Save Changes
      </button>
    </form>
  );
}

export default EditUserForm;