import React, { useState } from "react";

// Package definitions
const PACKAGES = {
  package1: {
    name: "Starter Package",
    price: 5000,
    maxAdmins: 1,
    maxMembers: 15,
    description: "Perfect for small sahakaris",
  },
  package2: {
    name: "Professional Package",
    price: 10000,
    maxAdmins: 2,
    maxMembers: 30,
    description: "Ideal for growing sahakaris",
  },
  package3: {
    name: "Custom Package",
    price: null, // Will be calculated based on counts
    maxAdmins: null, // No limit
    maxMembers: null, // No limit
    description: "Flexible solution for large sahakaris",
    pricePerAdmin: 3000,
    pricePerMember: 200,
  },
};

export default function AddNetworkForm({
  onClose,
  onNetworkAdded,
  apiBase = "http://localhost:8080/api",
}) {
  const [formData, setFormData] = useState({
    registeredId: "",
    name: "",
    address: "",
    createdAt: "",
    phone: "",
    packageType: "", // New field for package selection
    staffCount: "",
    userCount: "",
  });

  const [document, setDocument] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = formData.packageType
    ? PACKAGES[formData.packageType]
    : null;

  // Calculate price based on package
  const calculatePrice = () => {
    if (!selectedPackage) return 0;

    if (formData.packageType === "package3") {
      const admins = parseInt(formData.staffCount) || 0;
      const members = parseInt(formData.userCount) || 0;
      return (
        admins * selectedPackage.pricePerAdmin +
        members * selectedPackage.pricePerMember
      );
    }

    return selectedPackage.price;
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    // If package changes, reset counts
    if (name === "packageType") {
      const pkg = PACKAGES[value];
      setFormData((prev) => ({
        ...prev,
        packageType: value,
        staffCount:
          value === "package1" ? "1" : value === "package2" ? "2" : "",
        userCount:
          value === "package1" ? "15" : value === "package2" ? "30" : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle document upload
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (optional)
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid document (PDF, JPG, or PNG)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        return;
      }

      setDocument(file);
      setError("");
    }
  };

  // Validate counts based on package
  const validateCounts = () => {
    if (!selectedPackage) {
      setError("Please select a package");
      return false;
    }

    const staffCount = parseInt(formData.staffCount) || 0;
    const userCount = parseInt(formData.userCount) || 0;

    // For package1 and package2, enforce limits
    if (formData.packageType !== "package3") {
      if (staffCount > selectedPackage.maxAdmins) {
        setError(
          `Staff count cannot exceed ${selectedPackage.maxAdmins} for this package`
        );
        return false;
      }
      if (userCount > selectedPackage.maxMembers) {
        setError(
          `User count cannot exceed ${selectedPackage.maxMembers} for this package`
        );
        return false;
      }
    }

    // Minimum validation
    if (staffCount < 1) {
      setError("At least 1 admin is required");
      return false;
    }
    if (userCount < 1) {
      setError("At least 1 member is required");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!validateCounts()) {
      setSaving(false);
      return;
    }

    try {
      // Use FormData to handle file upload
      const formDataToSend = new FormData();

      formDataToSend.append("registeredId", formData.registeredId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("createdAt", formData.createdAt || "");
      formDataToSend.append("phone", formData.phone || "");
      formDataToSend.append("packageType", formData.packageType);
      formDataToSend.append("packagePrice", calculatePrice().toString());
      formDataToSend.append("staffCount", formData.staffCount);
      formDataToSend.append("userCount", formData.userCount);

      // Append document if uploaded
      if (document) {
        formDataToSend.append("document", document);
      }

      const url = `${apiBase}/networks`;

      console.log("Submitting to:", url);
      console.log("Package Type:", formData.packageType);
      console.log("Package Price:", calculatePrice());
      console.log("Document:", document?.name);

      const res = await fetch(url, {
        method: "POST",
        body: formDataToSend,
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      console.log("HTTP Status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("Error response:", text);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const saved = await res.json();
      console.log("Saved network:", saved);

      onNetworkAdded?.(saved);
      onClose?.();
    } catch (err) {
      console.error("Error adding network:", err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isCustomPackage = formData.packageType === "package3";

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* Basic Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* <input
          name="registeredId"
          onChange={onChange}
          value={formData.registeredId}
          placeholder="Registered ID"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          required
        /> */}
        <input
          name="name"
          onChange={onChange}
          value={formData.name}
          placeholder="Sahakari Name"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
          required
        />
        <input
          name="address"
          onChange={onChange}
          value={formData.address}
          placeholder="Address"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
        <input
          name="phone"
          onChange={onChange}
          value={formData.phone}
          placeholder="Phone"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
        <input
          name="createdAt"
          onChange={onChange}
          value={formData.createdAt}
          placeholder="Created At (e.g., 13-Nov-2025)"
          className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
        />
      </div>

      {/* Package Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-800">Select Package</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PACKAGES).map(([key, pkg]) => (
            <label
              key={key}
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.packageType === key
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <input
                type="radio"
                name="packageType"
                value={key}
                checked={formData.packageType === key}
                onChange={onChange}
                className="absolute top-3 right-3"
                required
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 mb-2">{pkg.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>

                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Max Admins:</span>{" "}
                    {pkg.maxAdmins ?? "Unlimited"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Max Members:</span>{" "}
                    {pkg.maxMembers ?? "Unlimited"}
                  </p>
                </div>

                {pkg.price !== null ? (
                  <p className="mt-3 text-xl font-bold text-teal-600">
                    रु {pkg.price.toLocaleString()}
                  </p>
                ) : (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>रु {pkg.pricePerAdmin.toLocaleString()}/admin</p>
                    <p>रु {pkg.pricePerMember.toLocaleString()}/member</p>
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Staff and User Count */}
      {selectedPackage && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800">
            Configure Capacity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Count
                {!isCustomPackage && (
                  <span className="text-gray-500 ml-1">
                    (Max: {selectedPackage.maxAdmins})
                  </span>
                )}
                {isCustomPackage && (
                  <span className="text-gray-500 ml-1">(Min: 2)</span>
                )}
              </label>
              <input
                type="number"
                name="staffCount"
                onChange={onChange}
                value={formData.staffCount}
                placeholder={
                  isCustomPackage ? "Minimum 2 admins" : "Number of Admins"
                }
                className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300"
                min={isCustomPackage ? "2" : "1"}
                max={!isCustomPackage ? selectedPackage.maxAdmins : undefined}
                disabled={!isCustomPackage}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Count
                {!isCustomPackage && (
                  <span className="text-gray-500 ml-1">
                    (Max: {selectedPackage.maxMembers})
                  </span>
                )}
                {isCustomPackage && (
                  <span className="text-gray-500 ml-1">(Min: 30)</span>
                )}
              </label>
              <input
                type="number"
                name="userCount"
                onChange={onChange}
                value={formData.userCount}
                placeholder={
                  isCustomPackage ? "Minimum 30 members" : "Number of Members"
                }
                className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300"
                min={isCustomPackage ? "30" : "1"}
                max={!isCustomPackage ? selectedPackage.maxMembers : undefined}
                disabled={!isCustomPackage}
                required
              />
            </div>
          </div>

          {/* Price Summary */}
          {formData.packageType && (
            <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">
                  Total Price:
                </span>
                <span className="text-2xl font-bold text-teal-600">
                  रु {calculatePrice().toLocaleString()}
                </span>
              </div>
              {isCustomPackage && formData.staffCount && formData.userCount && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    {formData.staffCount} admin(s) × रु{" "}
                    {selectedPackage.pricePerAdmin.toLocaleString()} = रु{" "}
                    {(
                      parseInt(formData.staffCount) *
                      selectedPackage.pricePerAdmin
                    ).toLocaleString()}
                  </p>
                  <p>
                    {formData.userCount} member(s) × रु{" "}
                    {selectedPackage.pricePerMember.toLocaleString()} = रु{" "}
                    {(
                      parseInt(formData.userCount) *
                      selectedPackage.pricePerMember
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Registration Document
          <span className="text-gray-500 ml-1">
            (Optional - PDF, JPG, PNG - Max 5MB)
          </span>
        </label>
        <div className="relative">
          <input
            type="file"
            onChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
          {document && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{document.name}</span>
              <button
                type="button"
                onClick={() => setDocument(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !formData.packageType}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Add Network"}
        </button>
      </div>
    </form>
  );
}
