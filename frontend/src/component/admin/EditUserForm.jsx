import React, { useState, useEffect } from "react";

/**
 * A form to edit an existing user's details.
 * @param {object} props
 * @param {object} props.user - The user object to edit.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onUserUpdated - Callback when user is successfully updated.
 * @param {string} props.apiBase - Base URL for API calls.
 */
function EditUserForm({ user, onClose, onUserUpdated, apiBase }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member",
    sahakari: "",
    status: "Pending",
    password: "", // Will hold the original password
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill the form when the 'user' prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "member",
        sahakari: user.sahakari || "",
        status: user.status || "Pending",
        // --- THIS IS THE FIX ---
        // Store the original password in the state.
        // We will send this back to the backend.
        password: user.password || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send the entire formData state, which now includes
      // all fields, including the original password.
      const response = await fetch(`${apiBase}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update user: ${response.statusText}`
        );
      }

      const updatedUser = await response.json();
      
      console.log(`Successfully updated user ${user.id}:`, updatedUser);
      
      // Call the callback to update the parent component's state
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      
      // Show success message
      alert(`User "${formData.name}" updated successfully!`);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message || "Failed to update user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Don't render if no user is provided

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

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
          disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
        />
      </div>

      {/* Role (Read-only display) */}
      <div>
        <label className="block font-semibold mb-2">Role</label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-700 capitalize">
          {formData.role}
        </div>
      </div>

      {/* Sahakari (Read-only display) */}
      <div>
        <label className="block font-semibold mb-2">Associated Sahakari</label>
        <div className="w-full px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-gray-700">
          {formData.sahakari || "Not assigned"}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block font-semibold mb-2">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          disabled={loading}
        >
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-full hover:bg-gray-300 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default EditUserForm;