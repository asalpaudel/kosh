import React, { useState } from 'react';
import { BuildingIcon } from '../icons';

// --- Reusable File Input Component ---
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

// --- Stepper UI Component ---
// Updated to 4 steps
const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center w-full mb-4">
    {/* Step 1: Basic */}
    <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 1 ? 'border-teal-500' : 'border-gray-400'}`}>
        1
      </div>
      <span className="text-xs font-semibold mt-1">Basic</span>
    </div>
    
    <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
    
    {/* Step 2: Branding */}
    <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 2 ? 'border-teal-500' : 'border-gray-400'}`}>
        2
      </div>
      <span className="text-xs font-semibold mt-1">Branding</span>
    </div>
    
    <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>

    {/* Step 3: Legal (Part 1) */}
    <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 3 ? 'border-teal-500' : 'border-gray-400'}`}>
        3
      </div>
      <span className="text-xs font-semibold mt-1">Legal Docs</span>
    </div>

    <div className={`flex-1 h-1 mx-2 ${currentStep >= 4 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>

    {/* Step 4: Legal (Part 2) */}
    <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 4 ? 'border-teal-500' : 'border-gray-400'}`}>
        4
      </div>
      <span className="text-xs font-semibold mt-1">Signatory</span>
    </div>
  </div>
);


function AddNetworkForm({ onClose }) {
  // State for the current step
  const [step, setStep] = useState(1);

  // State to hold all form fields
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
    console.log('New Network Data:', formData);
    alert(`Sahakari "${formData.name}" created!`);
    onClose(); // Close the modal on submit
  };

  // --- Step Navigation Functions ---
  
  const nextStep = () => {
    // Add validation check for Step 1
    if (step === 1) {
      if (!formData.name || !formData.address || !formData.phone) {
        alert('Please fill in all required fields to continue.');
        return;
      }
    }
    // Update step limit
    if (step < 4) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };


  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex flex-col gap-6"
    >
      <div className="flex justify-center -mb-2">
        <BuildingIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* Render the 4-Step Stepper */}
      <Stepper currentStep={step} />

      {/* --- Step 1: Basic Information --- */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 text-center">Basic Information</h3>
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
        </div>
      )}

      {/* --- Step 2: Branding --- */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 text-center">Branding</h3>
          <FileInput
            label="Upload Logo"
            name="logo"
            onChange={handleChange}
            accept=".png, .jpg, .jpeg, .svg"
            helpText="Upload the official logo (e.g., PNG, JPG)."
          />
        </div>
      )}

      {/* --- Step 3: Legal Documents (Part 1) --- */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 text-center">Legal Documents</h3>
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
        </div>
      )}

      {/* --- Step 4: Legal Documents (Part 2) --- */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 text-center">Signatory & Contract</h3>
          <FileInput
            label="Official Board Decision (संचालक समितिको निर्णय)"
            name="boardDecision"
            onChange={handleChange}
            accept=".pdf, .png, .jpg, .jpeg"
            required={true}
            helpText="Must state the decision to use the service and the authorized signatory."
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
        </div>
      )}


      {/* --- Navigation Buttons --- */}
      <div className="flex justify-between mt-6">
        {/* "Back" button: Show on steps 2, 3 & 4 */}
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-full hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        ) : (
          <div></div> // Empty div to keep "Next" button on the right
        )}

        {/* "Next" button: Show on steps 1, 2 & 3 */}
        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-teal-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-teal-600 transition-colors"
          >
            Next
          </button>
        ) : null}

        {/* "Submit" button: Show only on step 4 */}
        {step === 4 ? (
          <button
            type="submit"
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-4"
          >
            Add Sahakari
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default AddNetworkForm;