import React, { useState, useEffect } from "react";
// --- NO LINK IMPORT NEEDED ---
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  EyeIcon,
} from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";
// --- IMPORT THE NEW FORM COMPONENT ---
import ApplyPackageForm from "../../component/user/ApplyPackageForm.jsx";

const apiBase = "http://localhost:8080/api";

// A simplified action component for users (View only)
const PackageActions = ({ pkg, onView }) => (
  <div className="flex items-center justify-end space-x-2">
    <button
      onClick={() => onView(pkg)}
      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
      title="View Package Details"
    >
      <EyeIcon className="w-5 h-5" />
    </button>
  </div>
);

// --- MODIFICATION IS HERE: ADD onApplyClick PROP ---
const ViewPackageModal = ({
  isOpen,
  onClose,
  packageData,
  packageType,
  onApplyClick,
}) => {
  if (!packageData) return null;

  // This function decides the text for the "Apply" button
  const getApplyText = () => {
    switch (packageType) {
      case "fixed-deposit":
        return "Apply for this Fixed Deposit";
      case "saving-account":
        return "Open this Savings Account";
      case "loan-package":
        return "Apply for this Loan";
      default:
        return "Apply Now";
    }
  };

  const renderContent = () => {
    // ... (This switch statement is UNCHANGED) ...
    switch (packageType) {
      case "fixed-deposit":
        return (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block font-semibold mb-2">Package Name</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                {packageData.name}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">
                  Interest Rate (%)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  {packageData.interestRate}%
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Minimum Duration (months)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  {packageData.minDuration} months
                </div>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Minimum Amount</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                Rs. {packageData.minAmount?.toLocaleString()}
              </div>
            </div>
            {packageData.description && (
              <div>
                <label className="block font-semibold mb-2">Description</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 min-h-[80px]">
                  {packageData.description}
                </div>
              </div>
            )}
          </div>
        );
      case "saving-account":
        return (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block font-semibold mb-2">Package Name</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                {packageData.name}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">
                  Interest Rate (%)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  {packageData.interestRate}%
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Minimum Balance
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  Rs. {packageData.minBalance?.toLocaleString()}
                </div>
              </div>
            </div>
            {packageData.description && (
              <div>
                <label className="block font-semibold mb-2">Description</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 min-h-[80px]">
                  {packageData.description}
                </div>
              </div>
            )}
          </div>
        );
      case "loan-package":
        return (
          <div className="flex flex-col gap-5">
            <div>
              <label className="block font-semibold mb-2">Package Name</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                {packageData.name}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">
                  Interest Rate (%)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  {packageData.interestRate}%
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Maximum Duration (months)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                  {packageData.maxDuration} months
                </div>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Maximum Amount</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                Rs. {packageData.maxAmount?.toLocaleString()}
              </div>
            </div>
            {packageData.description && (
              <div>
                <label className="block font-semibold mb-2">Description</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 min-h-[80px]">
                  {packageData.description}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View Package Details"
      size="xl"
    >
      {renderContent()}

      {/* --- THIS SECTION IS MODIFIED --- */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          onClick={onApplyClick} // Use the prop here
          className="bg-teal-500 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-600 transition-colors text-base"
        >
          {getApplyText()}
        </button>
      </div>
      {/* --- END OF MODIFICATION --- */}
    </Modal>
  );
};

// Main component
function UserPackages() {
  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // View modal state
  const [viewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [currentPackageToView, setCurrentPackageToView] = useState(null);
  const [currentPackageType, setCurrentPackageType] = useState(null);

  // --- ADD STATE FOR THE APPLY MODAL ---
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [currentPackageToApply, setCurrentPackageToApply] = useState(null);
  // (we can reuse currentPackageType for the apply modal)

  // ... (useEffect for fetchSession is UNCHANGED) ...

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();

          // If session contains error → redirect
          if (data.error) {
            console.error("Session error:", data.error);
            window.location.href = "/";
            return;
          }

          // User must have sahakariId unless superadmin
          if (!data.sahakariId && data.userRole !== "superadmin") {
            console.error("No sahakariId found in session");
            window.location.href = "/";
            return;
          }

          setSelectedNetworkId(data.sahakariId);
        } else if (response.status === 401) {
          console.error("Unauthorized - no session");
          window.location.href = "/";
        } else {
          console.error("Failed to fetch session data");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        window.location.href = "/";
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, []);

  // ... (useEffect for fetchData is UNCHANGED) ...
  useEffect(() => {
    if (selectedNetworkId) {
      fetchData();
    }
  }, [selectedNetworkId]);

  const fetchData = async () => {
    if (!selectedNetworkId) return;
    setLoading(true);
    try {
      const [fdRes, saRes, lpRes] = await Promise.all([
        fetch(`${apiBase}/finance/fixed-deposits/${selectedNetworkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/finance/saving-accounts/${selectedNetworkId}`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/finance/loan-packages/${selectedNetworkId}`, {
          credentials: "include",
        }),
      ]);

      setFixedDeposits(await fdRes.json());
      setSavingAccounts(await saRes.json());
      setLoans(await lpRes.json());
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // View handler (UNMODIFIED)
  const handleViewPackage = (pkg, type) => {
    setCurrentPackageToView(pkg);
    setCurrentPackageType(type);
    setViewPackageModalOpen(true);
  };

  // --- ADD HANDLER FOR APPLY BUTTON CLICK ---
  const handleApplyClick = () => {
    // 1. Set data for the new modal
    setCurrentPackageToApply(currentPackageToView);
    // (currentPackageType is already set)

    // 2. Close the current (view) modal
    setViewPackageModalOpen(false);
    setCurrentPackageToView(null);

    // 3. Open the new (apply) modal
    setIsApplyModalOpen(true);
  };

  // ... (sessionLoading and selectedNetworkId checks are UNCHANGED) ...
  if (sessionLoading) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md flex items-center justify-center">
        <p className="text-center text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (!selectedNetworkId) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md flex items-center justify-center">
        <p className="text-center text-red-500">
          Unable to load packages. Please try logging in again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-gray-500">Loading packages...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fixed Deposits */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              {/* ... (Header is unchanged) ... */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-teal-500" />
                Fixed Deposits
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  {/* ... (Table head is unchanged) ... */}
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixedDeposits.length > 0 ? (
                      fixedDeposits.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="py-3 px-2 text-gray-800 font-medium">
                            {pkg.name}
                          </td>
                          <td className="py-3 px-2">
                            <PackageActions
                              pkg={pkg}
                              onView={() =>
                                handleViewPackage(pkg, "fixed-deposit")
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="py-8 text-center text-gray-400"
                        >
                          No Fixed Deposit Packages
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Saving Accounts */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              {/* ... (Header is unchanged) ... */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-teal-500" />
                Saving Accounts
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  {/* ... (Table head is unchanged) ... */}
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savingAccounts.length > 0 ? (
                      savingAccounts.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="py-3 px-2 text-gray-800 font-medium">
                            {pkg.name}
                          </td>
                          <td className="py-3 px-2">
                            <PackageActions
                              pkg={pkg}
                              onView={() =>
                                handleViewPackage(pkg, "saving-account")
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="py-8 text-center text-gray-400"
                        >
                          No Saving Account Packages
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Loan Packages */}
            <div className="border border-gray-200 rounded-lg p-4 shadow-lg">
              {/* ... (Header is unchanged) ... */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-teal-500" />
                Loan Packages
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  {/* ... (Table head is unchanged) ... */}
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length > 0 ? (
                      loans.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="py-3 px-2 text-gray-800 font-medium">
                            {pkg.name}
                          </td>
                          <td className="py-3 px-2">
                            <PackageActions
                              pkg={pkg}
                              onView={() =>
                                handleViewPackage(pkg, "loan-package")
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="py-8 text-center text-gray-400"
                        >
                          No Loan Packages
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <ViewPackageModal
        isOpen={viewPackageModalOpen}
        onClose={() => {
          setViewPackageModalOpen(false);
          setCurrentPackageToView(null);
          setCurrentPackageType(null);
        }}
        packageData={currentPackageToView}
        packageType={currentPackageType}
        onApplyClick={handleApplyClick} // --- PASS THE HANDLER HERE ---
      />

      {/* --- ADD THE NEW APPLY MODAL --- */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setCurrentPackageToApply(null);
          setCurrentPackageType(null);
        }}
        title="Package Application Form" // Title for the modal window
        size="2xl" // Use "2xl" for a wider form
      >
        {/* Render the form component only when the modal is open */}
        {currentPackageToApply && (
          <ApplyPackageForm
            packageData={currentPackageToApply}
            packageType={currentPackageType}
            onClose={() => {
              setIsApplyModalOpen(false);
              setCurrentPackageToApply(null);
              setCurrentPackageType(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

export default UserPackages;
