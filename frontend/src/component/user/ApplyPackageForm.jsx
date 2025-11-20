import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '../icons';

const apiBase = "http://localhost:8080/api";

// Form for Fixed Deposits
const FixedDepositForm = ({ packageData, formData, setFormData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Deposit Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.depositAmount}
        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
        placeholder={`Min: ${packageData.minAmount?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minAmount}
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Deposit Term (in Months) *</label>
      <input
        type="number"
        value={formData.depositTerm}
        onChange={(e) => setFormData({ ...formData, depositTerm: e.target.value })}
        placeholder={`Min: ${packageData.minDuration} months`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minDuration}
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" package with {packageData.interestRate}% interest rate.
    </p>
  </div>
);

// Form for Savings Accounts
const SavingAccountForm = ({ packageData, formData, setFormData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Initial Deposit Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.initialDeposit}
        onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
        placeholder={`Min Balance: ${packageData.minBalance?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minBalance}
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying to open the "{packageData.name}" account with {packageData.interestRate}% interest rate.
    </p>
  </div>
);

// Form for Loan Packages
const LoanForm = ({ packageData, formData, setFormData }) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Requested Loan Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.requestedAmount}
        onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
        placeholder={`Max: ${packageData.maxAmount?.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        max={packageData.maxAmount}
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Purpose of Loan *</label>
      <textarea
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        placeholder="e.g., For purchasing a vehicle, home renovation..."
        rows="3"
        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 resize-none"
        required
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" loan with {packageData.interestRate}% interest rate
      (Max duration: {packageData.maxDuration} months).
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Fixed Deposit
    depositAmount: '',
    depositTerm: '',
    // Saving Account
    initialDeposit: '',
    // Loan
    requestedAmount: '',
    purpose: '',
  });

  // Configuration for different form types
  const formConfig = {
    'fixed-deposit': {
      title: 'Fixed Deposit Application',
      icon: <DocumentTextIcon className="w-16 h-16 text-teal-500" />,
      component: <FixedDepositForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/fixed-deposit',
      payload: () => ({
        packageId: packageData.id,
        depositAmount: parseFloat(formData.depositAmount),
        depositTerm: parseInt(formData.depositTerm),
      }),
    },
    'saving-account': {
      title: 'Open Savings Account',
      icon: <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />,
      component: <SavingAccountForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/saving-account',
      payload: () => ({
        packageId: packageData.id,
        initialDeposit: parseFloat(formData.initialDeposit),
      }),
    },
    'loan-package': {
      title: 'Loan Application',
      icon: <BanknotesIcon className="w-16 h-16 text-teal-500" />,
      component: <LoanForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/loan',
      payload: () => ({
        packageId: packageData.id,
        requestedAmount: parseFloat(formData.requestedAmount),
        purpose: formData.purpose,
      }),
    },
  };

  const currentConfig = formConfig[packageType] || {
    title: 'Application Form',
    icon: null,
    component: <p>Invalid package type.</p>,
    endpoint: '',
    payload: () => ({}),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}${currentConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(currentConfig.payload()),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('An error occurred while submitting your application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {isSubmitted ? (
        <div className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your application has been received and is pending admin approval. 
            You will be notified once it has been reviewed.
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {currentConfig.component}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 text-center bg-gray-200 text-gray-800 font-semibold py-3 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}