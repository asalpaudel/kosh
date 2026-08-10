import React, { useState } from "react";
import { BanknotesIcon } from "../icons";
import { apiFetch } from "../../lib/apiClient";

const apiBase = "http://localhost:8080/api";

function AddLoanForm({ onAdded, onClose, networkId }) {
  const [formData, setFormData] = useState({
    name: "",
    interestRate: "",
    maxAmount: "",
    maxDuration: "",
    description: "",
    banner: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bannerPreview, setBannerPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "banner" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, banner: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("interestRate", formData.interestRate);
      submitData.append("maxAmount", formData.maxAmount);
      submitData.append("maxDuration", formData.maxDuration);
      submitData.append("description", formData.description);

      if (formData.banner) {
        submitData.append("banner", formData.banner);
      }

      const response = await apiFetch(
        `${apiBase}/finance/loan-packages/${networkId}`,
        {
          method: "POST",
          body: submitData, // Don't set Content-Type, browser will set it
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Success! Response data:", data);

      onAdded();
      onClose();
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex justify-center">
          <BanknotesIcon className="w-16 h-16 text-teal-500" />
        </div>

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
                onClick={() => {
                  setFormData((prev) => ({ ...prev, banner: null }));
                  setBannerPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
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
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter package name"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>

        {/* Interest Rate and Max Duration in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Interest Rate (%)</label>
            <input
              name="interestRate"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={handleChange}
              placeholder="e.g., 12.5"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Maximum Duration (months)
            </label>
            <input
              name="maxDuration"
              type="number"
              value={formData.maxDuration}
              onChange={handleChange}
              placeholder="e.g., 60"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              required
            />
          </div>
        </div>

        {/* Maximum Amount */}
        <div>
          <label className="block font-semibold mb-2">Maximum Amount</label>
          <input
            name="maxAmount"
            type="number"
            step="0.01"
            value={formData.maxAmount}
            onChange={handleChange}
            placeholder="e.g., 500000"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter package description (optional)"
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add Loan Package"}
        </button>
      </form>
    </div>
  );
}

export default AddLoanForm;
