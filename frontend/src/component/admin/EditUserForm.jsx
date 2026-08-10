import React, { useState, useEffect } from "react";
import ConfirmationModal from "../ConfirmationModal.jsx";
import { apiFetch } from "../../lib/apiClient";

function EditUserForm({
  user,
  onClose,
  onUserUpdated,
  onUserDeleted,
  apiBase,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member",
    sahakari: "",
    status: "Pending",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "member",
        sahakari: user.sahakari || "",
        status: user.status || "Pending",
        password: user.password || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const res = await apiFetch(`${apiBase}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update user");

      const updated = await res.json();
      onUserUpdated?.(updated);
      alert(`User "${formData.name}" updated successfully`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${apiBase}/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      onUserDeleted?.(user.id);
      // alert(`User "${formData.name}" deleted`); // Optional
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white">
      {/* Header */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
            disabled={loading}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
            disabled={loading}
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
            disabled={loading}
          />
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-700 capitalize">
              {formData.role}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sahakari
            </label>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
              {formData.sahakari || "Not assigned"}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
            disabled={loading}
          >
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          {/* Left side: Delete OR placeholder */}
          {formData.status !== "Pending" ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
              disabled={loading}
            >
              Delete user permanently
            </button>
          ) : (
            <div />
          )}

          {/* Right side: Always right-aligned */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-green-400 text-black text-sm font-medium hover:bg-green-500 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete User"
        message={`Are you sure you want to delete "${formData.name}" permanently? This action cannot be undone.`}
        confirmText="Delete Permanently"
        type="danger"
      />
    </div>
  );
}

export default EditUserForm;
