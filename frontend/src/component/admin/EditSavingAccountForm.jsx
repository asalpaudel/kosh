import React, { useState } from "react";
import { apiFetch } from "../../lib/apiClient";

const apiBase = "http://localhost:8080/api";

export default function EditSavingAccountForm({ initialData, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    id: initialData.id,
    name: initialData.name ?? "",
    interestRate: initialData.interestRate ?? "",
    minBalance: initialData.minBalance ?? "",
    description: initialData.description ?? "",
  });

  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(
    initialData.bannerData ? `${apiBase}/finance/saving-accounts/${initialData.id}/banner` : null
  );
  const [removeBanner, setRemoveBanner] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "banner" && files && files[0]) {
      const file = files[0];
      setBanner(file);
      setRemoveBanner(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveBanner = () => {
    setBanner(null);
    setBannerPreview(null);
    setRemoveBanner(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("interestRate", formData.interestRate);
      submitData.append("minBalance", formData.minBalance);
      submitData.append("description", formData.description);
      submitData.append("removeBanner", removeBanner);

      if (banner) {
        submitData.append("banner", banner);
      }

      const res = await apiFetch(`${apiBase}/finance/saving-accounts/${formData.id}`, {
        method: "PUT",
        body: submitData,
      });

      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onUpdated?.(saved);
      onClose?.();
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Banner Image Upload */}
      <div>
        <label className="block font-semibold mb-2">Package Banner (Optional)</label>
        {bannerPreview && (
          <div className="mb-3 relative">
            <img
              src={bannerPreview}
              alt="Banner Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveBanner}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <input
          type="file"
          name="banner"
          accept="image/*"
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
        />
        <p className="text-xs text-gray-500 mt-1">Upload an attractive banner image for this package</p>
      </div>

      {/* Package Name */}
      <div>
        <label className="block font-semibold mb-2">Package Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter package name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Interest Rate and Min Balance in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Interest Rate (%)</label>
          <input
            type="number"
            step="0.01"
            name="interestRate"
            value={formData.interestRate}
            onChange={handleChange}
            placeholder="e.g., 5.5"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Minimum Balance</label>
          <input
            type="number"
            step="0.01"
            name="minBalance"
            value={formData.minBalance}
            onChange={handleChange}
            placeholder="e.g., 5000"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter package description (optional)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {saving ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
}
