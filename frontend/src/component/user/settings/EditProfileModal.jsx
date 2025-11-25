import React, { useState } from "react";

function EditProfileModal({ currentUserData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: currentUserData.name || "",
    email: currentUserData.email || "",
    phone: currentUserData.phone || "",
    address: currentUserData.address || "",
    secondaryAddress: currentUserData.secondaryAddress || "",
    secondaryContact: currentUserData.secondaryContact || "",
    role: currentUserData.role,
    sahakari: currentUserData.sahakari,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
     
      await onSave({ ...currentUserData, ...formData });
   
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Email (Cannot be changed)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-full text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Primary Address</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={2}
          placeholder="Enter your primary address"
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Secondary Address (Optional)</label>
        <textarea
          name="secondaryAddress"
          value={formData.secondaryAddress}
          onChange={handleChange}
          rows={2}
          placeholder="Enter an optional secondary address"
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Secondary Contact Info (Optional)</label>
        <input
          type="text"
          name="secondaryContact"
          value={formData.secondaryContact}
          onChange={handleChange}
          placeholder="e.g., Spouse Name, Phone Number"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default EditProfileModal;