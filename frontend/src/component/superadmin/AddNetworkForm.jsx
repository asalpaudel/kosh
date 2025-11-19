import React, { useState } from "react";

// Package definitions
const PACKAGES = {
  basic: {
    name: "Starter Package",
    price: 5000,
    maxAdmins: 1,
    maxMembers: 15,
    description: "Perfect for small sahakaris",
  },
  premium: {
    name: "Professional Package",
    price: 10000,
    maxAdmins: 2,
    maxMembers: 30,
    description: "Ideal for growing sahakaris",
  },
  custom: {
    name: "Custom Package",
    price: null,
    maxAdmins: null,
    maxMembers: null,
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
    panNumber: "",
    packageType: "",
    staffCount: "",
    userCount: "",
  });

  const [document, setDocument] = useState(null);
  const [documentBase64, setDocumentBase64] = useState(null);
  const [logo, setLogo] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = formData.packageType
    ? PACKAGES[formData.packageType]
    : null;

  const calculatePrice = () => {
    if (!selectedPackage) return 0;

    if (formData.packageType === "custom") {
      const admins = parseInt(formData.staffCount) || 0;
      const members = parseInt(formData.userCount) || 0;
      return (
        admins * selectedPackage.pricePerAdmin +
        members * selectedPackage.pricePerMember
      );
    }

    return selectedPackage.price;
  };

  // Convert file to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "packageType") {
      const pkg = PACKAGES[value];
      setFormData((prev) => ({
        ...prev,
        packageType: value,
        staffCount: value === "basic" ? "1" : value === "premium" ? "2" : "",
        userCount: value === "basic" ? "15" : value === "premium" ? "30" : "",
      }));
    } else if (name === "panNumber") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
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

      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setDocument(file);
        setDocumentBase64(base64);
        setError("");
      } catch (err) {
        setError("Failed to process document");
      }
    }
  };

  const onLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image (JPG or PNG)");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Logo size should not exceed 2MB");
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setLogo(file);
        setLogoBase64(base64);
        setError("");

        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError("Failed to process logo");
      }
    }
  };

  const validatePAN = (pan) => {
    const panRegex = /^[0-9]{1,9}$/;
    return panRegex.test(pan);
  };

  const validateCounts = () => {
    if (!selectedPackage) {
      setError("Please select a package");
      return false;
    }

    const staffCount = parseInt(formData.staffCount) || 0;
    const userCount = parseInt(formData.userCount) || 0;

    if (formData.packageType !== "custom") {
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

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    if (!validatePAN(formData.panNumber)) {
      setError("Invalid PAN number format. Should be like: 123456789");
      setSaving(false);
      return;
    }

    if (!documentBase64) {
      setError("Registration document is required");
      setSaving(false);
      return;
    }

    if (!logoBase64) {
      setError("Organization logo is required");
      setSaving(false);
      return;
    }

    if (!validateCounts()) {
      setSaving(false);
      return;
    }

    try {
      let adminLimit, userLimit;
      if (formData.packageType === "basic") {
        adminLimit = 1;
        userLimit = 15;
      } else if (formData.packageType === "premium") {
        adminLimit = 2;
        userLimit = 30;
      } else if (formData.packageType === "custom") {
        adminLimit = parseInt(formData.staffCount) || 0;
        userLimit = parseInt(formData.userCount) || 0;
      }

      // Create JSON payload with Base64 encoded files
      const payload = {
        registeredId: formData.registeredId,
        name: formData.name,
        address: formData.address,
        createdAt: formData.createdAt,
        phone: formData.phone,
        panNumber: formData.panNumber,
        packageType: formData.packageType,
        packagePrice: calculatePrice(),
        staffCount: parseInt(formData.staffCount),
        userCount: parseInt(formData.userCount),
        adminLimit: adminLimit,
        userLimit: userLimit,
        document: {
          data: documentBase64,
          filename: document.name,
          contentType: document.type
        },
        logo: {
          data: logoBase64,
          filename: logo.name,
          contentType: logo.type
        }
      };

      const url = `${apiBase}/networks/base64`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const saved = await res.json();
      onNetworkAdded?.(saved);
      onClose?.();
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isCustomPackage = formData.packageType === "custom";

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add New Network</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="registeredId"
                    onChange={onChange}
                    value={formData.registeredId}
                    placeholder="e.g., REG-2025-001"
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sahakari Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    onChange={onChange}
                    value={formData.name}
                    placeholder="Organization name"
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="panNumber"
                    onChange={onChange}
                    value={formData.panNumber}
                    placeholder="123456789"
                    maxLength={10}
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 10 digits
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    onChange={onChange}
                    value={formData.phone}
                    placeholder="Contact number"
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address"
                    onChange={onChange}
                    value={formData.address}
                    placeholder="Full address"
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="createdAt"
                    onChange={onChange}
                    value={formData.createdAt}
                    placeholder="e.g., yyyy-mm-dd"
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Organization Logo
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Logo <span className="text-red-500">*</span>
                  <span className="text-gray-500 ml-1 font-normal">
                    (JPG, PNG - Max 2MB)
                  </span>
                </label>
                <input
                  type="file"
                  onChange={onLogoChange}
                  accept=".jpg,.jpeg,.png"
                  className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  required
                />
                {logoPreview && (
                  <div className="mt-4 flex items-start gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain rounded-lg border-2 border-gray-200 bg-white p-2"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
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
                        {logo.name}
                      </p>
                      <button
                        onClick={() => {
                          setLogo(null);
                          setLogoBase64(null);
                          setLogoPreview(null);
                        }}
                        className="mt-2 text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Package Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Select Package
              </h3>

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
                      <h4 className="font-bold text-gray-800 mb-2">
                        {pkg.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {pkg.description}
                      </p>

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
                <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                  <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  Configure Capacity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Count <span className="text-red-500">*</span>
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
                        isCustomPackage
                          ? "Minimum 2 admins"
                          : "Number of Admins"
                      }
                      className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300 focus:ring-2 focus:ring-teal-500"
                      min={isCustomPackage ? "2" : "1"}
                      max={
                        !isCustomPackage ? selectedPackage.maxAdmins : undefined
                      }
                      disabled={!isCustomPackage}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Count <span className="text-red-500">*</span>
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
                        isCustomPackage
                          ? "Minimum 30 members"
                          : "Number of Members"
                      }
                      className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300 focus:ring-2 focus:ring-teal-500"
                      min={isCustomPackage ? "30" : "1"}
                      max={
                        !isCustomPackage
                          ? selectedPackage.maxMembers
                          : undefined
                      }
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
                    {isCustomPackage &&
                      formData.staffCount &&
                      formData.userCount && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            {formData.staffCount} admin(s) × रु{" "}
                            {selectedPackage.pricePerAdmin.toLocaleString()} =
                            रु{" "}
                            {(
                              parseInt(formData.staffCount) *
                              selectedPackage.pricePerAdmin
                            ).toLocaleString()}
                          </p>
                          <p>
                            {formData.userCount} member(s) × रु{" "}
                            {selectedPackage.pricePerMember.toLocaleString()} =
                            रु{" "}
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
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                Registration Document
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Registration Document{" "}
                  <span className="text-red-500">*</span>
                  <span className="text-gray-500 ml-1 font-normal">
                    (PDF, JPG, PNG - Max 5MB)
                  </span>
                </label>
                <input
                  type="file"
                  onChange={onFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full bg-white rounded-lg px-4 py-2 outline-none border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  required
                />
                {document && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                    <svg
                      className="w-5 h-5 text-teal-600 flex-shrink-0"
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
                    <span className="text-sm text-gray-700 flex-1">
                      {document.name}
                    </span>
                    <button
                      onClick={() => {
                        setDocument(null);
                        setDocumentBase64(null);
                      }}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.packageType}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? "Saving..." : "Add Network"}
          </button>
        </div>
      </div>
    </div>
  );
}