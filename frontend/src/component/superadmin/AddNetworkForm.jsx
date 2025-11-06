import React, { useState } from 'react';
import { BuildingIcon } from '../icons';

// --- Reusable File Input Component ---
// This helper component is used to reduce code repetition for all the file inputs.
const FileInput = ({ label, name, onChange, accept, required = false, helpText = null }) => (
  <div>
    <label className="block font-semibold mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {helpText && <p className="text-sm text-gray-500 -mt-2 mb-2">{helpText}</p>}
    <input
      type="file"
      name={name}
      accept={accept}
      onChange={onChange}
      required={required}
      className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
    />
  </div>
);


function AddNetworkForm({ onClose }) {
  // Updated state to hold all new document fields
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    logo: null,
    contract: null,
    panVat: null,
    registrationCert: null,
    taxClearance: null,
    signatoryId: null,
    boardDecision: null,
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
    // This now logs all the new file objects as well
    console.log('New Network Data:', formData);
    alert(`Sahakari "${formData.name}" created!`);
    onClose(); // Close the modal on submit
  };

  return (
    // We add a scrollbar for a better experience on small screens
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-2"
    >
      <div className="flex justify-center -mb-2">
        <BuildingIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* --- Section 1: Basic Information --- */}
      <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Basic Information</h3>

      {/* Sahakari Name */}
      <div>
        <label className="block font-semibold mb-2">Sahakari Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter the official sahakari name"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Address */}
      <div>
        <label className="block font-semibold mb-2">Address <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter the primary office address"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block font-semibold mb-2">Phone Number <span className="text-red-500">*</span></label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter office contact number"
          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          required
        />
      </div>

      {/* --- Section 2: Branding --- */}
      <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Branding</h3>
      
      <FileInput
        label="Upload Logo"
        name="logo"
        onChange={handleChange}
        accept=".png, .jpg, .jpeg, .svg"
        helpText="Upload the official logo (e.g., PNG, JPG)."
      />

      {/* --- Section 3: Legal Documents --- */}
      <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Legal Documents</h3>
      
      <FileInput
        label="Official Board Decision (संचालक समितिको निर्णय)"
        name="boardDecision"
        onChange={handleChange}
        accept=".pdf, .png, .jpg, .jpeg"
        required={true}
        helpText="Must state the decision to use the service and the authorized signatory."
      />
      <FileInput
        label="Sahakari Registration Certificate"
        name="registrationCert"
        onChange={handleChange}
        accept=".pdf, .png, .jpg, .jpeg"
        required={true}
      />
      <FileInput
        label="PAN / VAT Certificate"
        name="panVat"
        onChange={handleChange}
        accept=".pdf, .png, .jpg, .jpeg"
        required={true}
      />
      <FileInput
        label="Latest Tax Clearance"
        name="taxClearance"
        onChange={handleChange}
        accept=".pdf, .png, .jpg, .jpeg"
        required={true}
      />
      <FileInput
        label="Signatory's ID (Citizenship)"
        name="signatoryId"
        onChange={handleChange}
        accept=".pdf, .png, .jpg, .jpeg"
        required={true}
        helpText="A copy of the authorized person's citizenship."
      />
      <FileInput
        label="Service Contract (Optional)"
        name="contract"
        onChange={handleChange}
        accept=".pdf"
        helpText="Upload the signed service agreement if available."
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
      >
        Add Sahakari
      </button>
    </form>
  );
}

export default AddNetworkForm;