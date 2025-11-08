import React, { useState } from 'react';
import { UserCircleIcon } from '../icons';

const sahakariList = [
  "Sahakari 1",
  "Sahakari 2",
  "Geda Sahakari",
  "Janata Sahakari",
];

const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-center w-full mb-4">
    <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 1 ? 'border-teal-500' : 'border-gray-400'}`}>
        1
      </div>
      <span className="text-xs font-semibold mt-1">Details</span>
    </div>
    
    <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
    
    <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-teal-500' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${currentStep >= 2 ? 'border-teal-500' : 'border-gray-400'}`}>
        2
      </div>
      <span className="text-xs font-semibold mt-1">Documents</span>
    </div>
  </div>
);

function AddUserForm({ onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    sahakari: '',
    password: '',
    photo: null,
    citizenship: null,
    signature: null,
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
    console.log('New User (Member) Data:', formData);
    alert(`User "${formData.name}" created!`);
    onClose();
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.sahakari || !formData.password) {
        alert('Please fill in all required fields.');
        return;
      }
    }
    if (step < 2) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex justify-center">
        <UserCircleIcon className="w-16 h-16 text-teal-500" />
      </div>

      <Stepper currentStep={step} />

      {step === 1 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">User Details</h3>
          <div>
            <label className="block font-semibold mb-2">Full Name <span className="text-red-500">*</span></label>
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

          <div>
            <label className="block font-semibold mb-2">Email <span className="text-red-500">*</span></label>
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

          <div>
            <label className="block font-semibold mb-2">Select Sahakari <span className="text-red-500">*</span></label>
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

          <div>
            <label className="block font-semibold mb-2">Temporary Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a temporary password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              required
            />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 -mb-2 text-center">User Documents</h3>
          <div>
            <label className="block font-semibold mb-2">
              User's Photo (Image)
            </label>
            <input
              type="file"
              name="photo"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Citizenship (PDF / Image)
            </label>
            <input
              type="file"
              name="citizenship"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              User's Signature (Image)
            </label>
            <input
              type="file"
              name="signature"
              accept=".png, .jpg, .jpeg"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-500 file:text-white file:font-semibold hover:file:bg-teal-600 transition"
            />
          </div>
        </>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 2 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-black text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        ) : null}

        {step === 2 ? (
          <button
            type="submit"
            className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors"
          >
            Add User
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default AddUserForm;