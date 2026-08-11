import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { API_BASE as apiBase, ApiError, apiFetch } from "../../lib/apiClient";
import { packageBannerUrl, type FinancePackage, type PackageType } from "../../lib/packages";
import BsDatePicker from "../BsDatePicker";
import { todayInNepal } from "../../lib/nepaliDate";
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
  collateralType: string;
  collateralValuation: string;
  valuer: string;
  valuationDate: string;
  collateralDocumentReference: string;
  plotNumber: string;
  landArea: string;
  collateralLocation: string;
  ownershipDocumentReference: string;
  guarantorEmail: string;
  guarantorLiability: string;
  consentReference: string;
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
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-teal-800">Collateral</p>
      <p className="mt-1 text-xs text-teal-700">Maximum {packageData.maxLoanToValuePercent ?? 70}% of verified value.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Type *<select value={formData.collateralType} onChange={(e) => { setFormData({ ...formData, collateralType: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-3" required>{["LAND","BUILDING","VEHICLE","DEPOSIT","EQUIPMENT","OTHER"].map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="text-sm font-semibold">Verified valuation (Rs.) *<input type="number" min="1" value={formData.collateralValuation} onChange={(e) => { setFormData({ ...formData, collateralValuation: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
        <label className="text-sm font-semibold">Valuer *<input value={formData.valuer} onChange={(e) => { setFormData({ ...formData, valuer: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
        <label className="text-sm font-semibold">Valuation date (BS) *<BsDatePicker value={formData.valuationDate} onChange={(valuationDate) => { setFormData({ ...formData, valuationDate }); }} className="mt-2" ariaLabel="Collateral valuation date in Bikram Sambat" /></label>
      </div>
      <label className="mt-4 block text-sm font-semibold">Valuation document reference *<input value={formData.collateralDocumentReference} onChange={(e) => { setFormData({ ...formData, collateralDocumentReference: e.target.value }); }} placeholder="Registry or file reference" className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
      {formData.collateralType === "LAND" && <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Plot number *<input value={formData.plotNumber} onChange={(e) => { setFormData({ ...formData, plotNumber: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
        <label className="text-sm font-semibold">Area *<input value={formData.landArea} onChange={(e) => { setFormData({ ...formData, landArea: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
        <label className="text-sm font-semibold">Location *<input value={formData.collateralLocation} onChange={(e) => { setFormData({ ...formData, collateralLocation: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
        <label className="text-sm font-semibold">Ownership document *<input value={formData.ownershipDocumentReference} onChange={(e) => { setFormData({ ...formData, ownershipDocumentReference: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 px-4 py-3" required /></label>
      </div>}
    </div>
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-gray-700">Guarantor (optional)</p>
      <p className="mt-1 text-xs text-gray-500">Must be an active member with no overdue instalments. Keep the signed consent reference.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Member email<input type="email" value={formData.guarantorEmail} onChange={(e) => { setFormData({ ...formData, guarantorEmail: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-3" /></label>
        <label className="text-sm font-semibold">Liability (Rs.)<input type="number" min="1" value={formData.guarantorLiability} onChange={(e) => { setFormData({ ...formData, guarantorLiability: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-3" /></label>
      </div>
      <label className="mt-4 block text-sm font-semibold">Signed consent reference<input value={formData.consentReference} onChange={(e) => { setFormData({ ...formData, consentReference: e.target.value }); }} className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-3" /></label>
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
    collateralType: 'LAND', collateralValuation: '', valuer: '', valuationDate: todayInNepal(),
    collateralDocumentReference: '', plotNumber: '', landArea: '', collateralLocation: '',
    ownershipDocumentReference: '', guarantorEmail: '', guarantorLiability: '', consentReference: '',
  });

  const [bannerError, setBannerError] = useState(false);

  const bannerUrl = packageBannerUrl(apiBase, packageData, packageType);

  // Configuration for different form types
  const formConfig: Record<PackageType, {
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
    endpoint: string;
    payload: () => Record<string, unknown>;
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
        collaterals: [{ type: formData.collateralType, valuation: Number(formData.collateralValuation),
          valuer: formData.valuer.trim(), valuationDate: formData.valuationDate,
          documentReference: formData.collateralDocumentReference.trim(), plotNumber: formData.plotNumber.trim(),
          area: formData.landArea.trim(), location: formData.collateralLocation.trim(),
          ownershipDocumentReference: formData.ownershipDocumentReference.trim() }],
        guarantors: formData.guarantorEmail.trim() ? [{ memberEmail: formData.guarantorEmail.trim(),
          liabilityAmount: Number(formData.guarantorLiability), consentReference: formData.consentReference.trim() }] : [],
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
      if (packageType === "loan-package" && formData.guarantorEmail.trim()
          && (!Number.isFinite(Number(formData.guarantorLiability)) || Number(formData.guarantorLiability) <= 0
            || !formData.consentReference.trim())) {
        throw new Error("Complete the guarantor liability and signed consent reference");
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
