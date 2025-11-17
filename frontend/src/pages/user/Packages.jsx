import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  EyeIcon,
} from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";

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

// This is the *exact* same View modal from the admin page, as it's read-only.
const ViewPackageModal = ({ isOpen, onClose, packageData, packageType }) => {
  if (!packageData) return null;

  const renderContent = () => {
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
                ₹{packageData.minAmount?.toLocaleString()}
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
                  ₹{packageData.minBalance?.toLocaleString()}
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
                ₹{packageData.maxAmount?.toLocaleString()}
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

  // Fetch user's sahakariId from their session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include", 
        });
        
        if (response.ok) {
          const data = await response.json();
          setSelectedNetworkId(data.sahakariId);
        } else {
          console.error("Failed to fetch session data");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Fetch packages for the user's sahakari
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

  useEffect(() => {
    if (selectedNetworkId) {
      fetchData();
    }
  }, [selectedNetworkId]);

  // View handler
  const handleViewPackage = (pkg, type) => {
    setCurrentPackageToView(pkg);
    setCurrentPackageType(type);
    setViewPackageModalOpen(true);
  };

  // Show loading state while fetching session
  if (sessionLoading) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md flex items-center justify-center">
        <p className="text-center text-gray-500">Loading session...</p>
      </div>
    );
  }

  // Show error if no network ID
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-teal-500" />
                Fixed Deposits
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">
                        View
                      </th>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-teal-500" />
                Saving Accounts
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">
                        View
                      </th>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-teal-500" />
                Loan Packages
              </h3>
              <div className="border-t border-gray-200 mt-2">
                <table className="w-full mt-3 text-left">
                  <thead>
                    <tr className="text-gray-600 text-sm">
                      <th className="py-2 px-2 font-medium">Package Name</th>
                      <th className="py-2 px-2 text-right font-medium">
                        View
                      </th>
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
      />
    </>
  );
}

export default UserPackages;