import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '../icons'; // --- THIS PATH IS NOW CORRECTED ---

// Dummy Form for Fixed Deposits
const FixedDepositForm = ({ packageData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Deposit Amount (Rs.)</label>
      <input
        type="number"
        placeholder={`Min: ${packageData.minAmount?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Deposit Term (in Months)</label>
      <input
        type="number"
        placeholder={`Min: ${packageData.minDuration} months`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" package. Terms and conditions
      apply.
    </p>
  </div>
);

// Dummy Form for Savings Accounts
const SavingAccountForm = ({ packageData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Initial Deposit Amount (Rs.)</label>
      <input
        type="number"
        placeholder={`Min Balance: ${packageData.minBalance?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying to open the "{packageData.name}" account. A minimum
      balance may be required.
    </p>
  </div>
);

// Dummy Form for Loan Packages
const LoanForm = ({ packageData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Requested Loan Amount (Rs.)</label>
      <input
        type="number"
        placeholder={`Max: ${packageData.maxAmount?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Purpose of Loan</label>
      <textarea
        placeholder="e.g., For purchasing a vehicle, home renovation..."
        rows="3"
        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none"
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" loan. Interest rates and
      duration are subject to package terms.
    </p>
  </div>
);

// Main Component
export default function ApplyPackageForm({
  packageData,
  packageType,
  onClose,
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Configuration for different form types
  const formConfig = {
    'fixed-deposit': {
      title: 'Fixed Deposit Application',
      icon: <DocumentTextIcon className="w-16 h-16 text-teal-500" />,
      component: <FixedDepositForm packageData={packageData} />,
    },
    'saving-account': {
      title: 'Open Savings Account',
      icon: <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />,
      component: <SavingAccountForm packageData={packageData} />,
    },
    'loan-package': {
      title: 'Loan Application',
      icon: <BanknotesIcon className="w-16 h-16 text-teal-500" />,
      component: <LoanForm packageData={packageData} />,
    },
  };

  const currentConfig = formConfig[packageType] || {
    title: 'Application Form',
    icon: null,
    component: <p>Invalid package type.</p>,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd send data to a backend here
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {isSubmitted ? (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your application has been received. Our team will review it and get
            back to you shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-teal-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-teal-600 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex justify-center">{currentConfig.icon}</div>

          <h1 className="text-3xl font-bold text-gray-900 text-center -mb-2">
            {currentConfig.title}
          </h1>
          
          <p className="text-center text-gray-600 font-medium">
            Applying for: <span className="text-teal-600">{packageData.name}</span>
          </p>

          {currentConfig.component}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 text-center bg-gray-200 text-gray-800 font-semibold py-3 rounded-full hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors"
            >
              Submit Application
            </button>
          </div>
        </form>
      )}
    </div>
  );
}