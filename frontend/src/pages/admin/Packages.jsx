import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";
import AddFixedDepositForm from "../../component/admin/AddFixedDepositForm.jsx";
import AddSavingAccountForm from "../../component/admin/AddSavingAccountForm.jsx";
import AddLoanForm from "../../component/admin/AddLoanForm.jsx";

const apiBase = "http://localhost:8080/api";

const PackageActions = ({ pkg, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-end space-x-2">
    <button
      onClick={() => onView(pkg)}
      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
      title="View Package"
    >
      <EyeIcon className="w-5 h-5" />
    </button>
    <button
      onClick={() => onEdit(pkg)}
      className="text-yellow-500 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-100 transition-colors"
      title="Edit Package"
    >
      <PencilIcon className="w-5 h-5" />
    </button>
    <button
      onClick={() => onDelete(pkg.id)}
      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
      title="Delete Package"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  </div>
);

function AdminPackages({ selectedNetworkId = 6 }) {
  // default for testing
  const [fixedDeposits, setFixedDeposits] = useState([]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAddFixedDepositModalOpen, setIsAddFixedDepositModalOpen] =
    useState(false);
  const [isAddSavingAccountModalOpen, setIsAddSavingAccountModalOpen] =
    useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [viewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [currentPackageToView, setCurrentPackageToView] = useState(null);

  // Fetch all finance data
  const fetchData = async () => {
    if (!selectedNetworkId) return;
    setLoading(true);
    try {
      const [fdRes, saRes, lpRes] = await Promise.all([
        fetch(`${apiBase}/finance/fixed-deposits/${selectedNetworkId}`),
        fetch(`${apiBase}/finance/saving-accounts/${selectedNetworkId}`),
        fetch(`${apiBase}/finance/loan-packages/${selectedNetworkId}`),
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
    fetchData();
  }, [selectedNetworkId]);

  // Delete handler
  const handleDeletePackage = async (id, type) => {
    const confirm = window.confirm(`Delete this ${type} package?`);
    if (!confirm) return;

    let url = `${apiBase}/finance/${type}/${id}`;
    await fetch(url, { method: "DELETE" });
    fetchData();
  };

  const handleViewPackage = (pkg) => {
    setCurrentPackageToView(pkg);
    setViewPackageModalOpen(true);
  };

  const handleAdded = () => {
    fetchData();
    setIsAddFixedDepositModalOpen(false);
    setIsAddSavingAccountModalOpen(false);
    setIsAddLoanModalOpen(false);
  };

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
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
                        Action
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
                              onView={handleViewPackage}
                              onEdit={() => alert("Edit not implemented")}
                              onDelete={() =>
                                handleDeletePackage(pkg.id, "fixed-deposits")
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
                        Action
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
                              onView={handleViewPackage}
                              onEdit={() => alert("Edit not implemented")}
                              onDelete={() =>
                                handleDeletePackage(pkg.id, "saving-accounts")
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
                        Action
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
                              onView={handleViewPackage}
                              onEdit={() => alert("Edit not implemented")}
                              onDelete={() =>
                                handleDeletePackage(pkg.id, "loan-packages")
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

      {/* Floating Add Buttons */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 opacity-0 scale-90 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-in-out">
          <button
            title="Add Loan Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddLoanModalOpen(true)}
          >
            <BanknotesIcon className="w-7 h-7" />
          </button>

          <button
            title="Add Saving Account Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddSavingAccountModalOpen(true)}
          >
            <CurrencyDollarIcon className="w-7 h-7" />
          </button>

          <button
            title="Add Fixed Deposit Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddFixedDepositModalOpen(true)}
          >
            <DocumentTextIcon className="w-7 h-7" />
          </button>
        </div>

        <button
          title="Add"
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddFixedDepositModalOpen}
        onClose={() => setIsAddFixedDepositModalOpen(false)}
        title="Add New Fixed Deposit Package"
        size="2xl"
      >
        <AddFixedDepositForm
          onAdded={handleAdded}
          networkId={selectedNetworkId}
        />
      </Modal>

      <Modal
        isOpen={isAddSavingAccountModalOpen}
        onClose={() => setIsAddSavingAccountModalOpen(false)}
        title="Add New Saving Account Package"
        size="2xl"
      >
        <AddSavingAccountForm
          onAdded={handleAdded}
          networkId={selectedNetworkId}
        />
      </Modal>

      <Modal
        isOpen={isAddLoanModalOpen}
        onClose={() => setIsAddLoanModalOpen(false)}
        title="Add New Loan Package"
        size="2xl"
      >
        <AddLoanForm onAdded={handleAdded} networkId={selectedNetworkId} />
      </Modal>
    </>
  );
}

export default AdminPackages;
