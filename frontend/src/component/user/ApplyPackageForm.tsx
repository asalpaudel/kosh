import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { API_BASE as apiBase, ApiError, apiFetch } from "../../lib/apiClient";
import { packageBannerUrl, type FinancePackage, type PackageType } from "../../lib/packages";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '../icons';


// Form for Fixed Deposits
interface ApplicationFields {
  depositAmount: string;
  depositTerm: string;
  initialDeposit: string;
  requestedAmount: string;
  duration: string;
  purpose: string;
}

interface SubformProps {
  packageData: FinancePackage;
  formData: ApplicationFields;
  setFormData: Dispatch<SetStateAction<ApplicationFields>>;
}

const FixedDepositForm = ({ packageData, formData, setFormData }: SubformProps) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Deposit Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.depositAmount}
        onChange={(e) => { setFormData({ ...formData, depositAmount: e.target.value }); }}
        placeholder={packageData.minAmount === null ? "Enter amount" : `Min: ${packageData.minAmount.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minAmount ?? undefined}
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Deposit Term (in Months) *</label>
      <input
        type="number"
        value={formData.depositTerm}
        onChange={(e) => { setFormData({ ...formData, depositTerm: e.target.value }); }}
        placeholder={packageData.minDuration === null ? "Enter duration" : `Min: ${packageData.minDuration.toString()} months`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minDuration ?? undefined}
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" package with {packageData.interestRate}% interest rate.
    </p>
  </div>
);

// Form for Savings Accounts
const SavingAccountForm = ({ packageData, formData, setFormData }: SubformProps) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Initial Deposit Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.initialDeposit}
        onChange={(e) => { setFormData({ ...formData, initialDeposit: e.target.value }); }}
        placeholder={packageData.minBalance === null ? "Enter initial deposit" : `Min Balance: ${packageData.minBalance.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        min={packageData.minBalance ?? undefined}
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying to open the "{packageData.name}" account with {packageData.interestRate}% interest rate.
    </p>
  </div>
);

// Form for Loan Packages
const LoanForm = ({ packageData, formData, setFormData }: SubformProps) => (
  <div className="flex flex-col gap-5">
    <div>
      <label className="block font-semibold mb-2">Requested Loan Amount (Rs.) *</label>
      <input
        type="number"
        value={formData.requestedAmount}
        onChange={(e) => { setFormData({ ...formData, requestedAmount: e.target.value }); }}
        placeholder={packageData.maxAmount === null ? "Enter amount" : `Max: ${packageData.maxAmount.toLocaleString()}`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        max={packageData.maxAmount ?? undefined}
      />
    </div>
    {/* ⭐ NEW: Duration Field */}
    <div>
      <label className="block font-semibold mb-2">Requested Duration (Months) *</label>
      <input
        type="number"
        value={formData.duration}
        onChange={(e) => { setFormData({ ...formData, duration: e.target.value }); }}
        placeholder={packageData.maxDuration === null ? "Enter duration" : `Max: ${packageData.maxDuration.toString()} months`}
        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-teal-500"
        required
        max={packageData.maxDuration ?? undefined}
      />
    </div>
    <div>
      <label className="block font-semibold mb-2">Purpose of Loan *</label>
      <textarea
        value={formData.purpose}
        onChange={(e) => { setFormData({ ...formData, purpose: e.target.value }); }}
        placeholder="e.g., For purchasing a vehicle, home renovation..."
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-teal-500 resize-none"
        required
      />
    </div>
    <p className="text-sm text-gray-500">
      You are applying for the "{packageData.name}" loan with {packageData.interestRate}% interest rate.
    </p>
  </div>
);

// Main Component
interface ApplyPackageFormProps {
  packageData: FinancePackage;
  packageType: PackageType;
  onClose: () => void;
}

export default function ApplyPackageForm({
  packageData,
  packageType,
  onClose,
}: ApplyPackageFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationFields>({
    // Fixed Deposit
    depositAmount: '',
    depositTerm: '',
    // Saving Account
    initialDeposit: '',
    // Loan
    requestedAmount: '',
    duration: '', // ⭐ NEW
    purpose: '',
  });

  const [bannerError, setBannerError] = useState(false);

  const bannerUrl = packageBannerUrl(apiBase, packageData, packageType);

  // Configuration for different form types
  const formConfig: Record<PackageType, {
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    endpoint: string;
    payload: () => Record<string, string | number>;
  }> = {
    'fixed-deposit': {
      title: 'Fixed Deposit Application',
      icon: <DocumentTextIcon className="w-16 h-16 text-teal-500" />,
      component: <FixedDepositForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/fixed-deposit',
      payload: () => ({
        packageId: packageData.id,
        depositAmount: Number(formData.depositAmount),
        depositTerm: Number(formData.depositTerm),
      }),
    },
    'saving-account': {
      title: 'Open Savings Account',
      icon: <CurrencyDollarIcon className="w-16 h-16 text-teal-500" />,
      component: <SavingAccountForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/saving-account',
      payload: () => ({
        packageId: packageData.id,
        initialDeposit: Number(formData.initialDeposit),
      }),
    },
    'loan-package': {
      title: 'Loan Application',
      icon: <BanknotesIcon className="w-16 h-16 text-teal-500" />,
      component: <LoanForm packageData={packageData} formData={formData} setFormData={setFormData} />,
      endpoint: '/applications/loan',
      payload: () => ({
        packageId: packageData.id,
        requestedAmount: Number(formData.requestedAmount),
        // ⭐ NEW: Sending requested duration (needs backend support if you haven't added it yet, but good to have)
        duration: Number(formData.duration),
        purpose: formData.purpose.trim(),
      }),
    },
  };

  const currentConfig = formConfig[packageType];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = currentConfig.payload();
      const numericValues = Object.values(payload).filter((value): value is number => typeof value === "number");
      if (numericValues.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error("Enter valid positive amounts and durations");
      }
      await apiFetch(`${apiBase}${currentConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Application submission failed");
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
        <form onSubmit={(event) => { void handleSubmit(event); }} className="flex flex-col gap-5">
          {/* Banner Image */}
          {bannerUrl && !bannerError ? (
            <div className="w-full h-56 rounded-xl overflow-hidden bg-gray-100 shadow-lg">
              <img
                src={bannerUrl}
                alt={`${packageData.name} banner`}
                className="w-full h-full object-cover"
                onError={() => { setBannerError(true); }}
              />
            </div>
          ) : (
            <div className="flex justify-center">{currentConfig.icon}</div>
          )}

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
