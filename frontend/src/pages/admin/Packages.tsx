import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Added useLocation
import { API_BASE as apiBase, apiFetch } from "../../lib/apiClient";
import { parseFinancePackages, type FinancePackage, type PackageType } from "../../lib/packages";
import { isRecord } from "../../lib/validation";
import {
  PlusCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "../../component/icons";
import Modal from "../../component/superadmin/Modal";

import AddFixedDepositForm from "../../component/admin/AddFixedDepositForm";
import AddSavingAccountForm from "../../component/admin/AddSavingAccountForm";
import AddLoanForm from "../../component/admin/AddLoanForm";

import EditFixedDepositForm from "../../component/admin/EditFixedDepositForm";
import EditSavingAccountForm from "../../component/admin/EditSavingAccountForm";
import EditLoanPackageForm from "../../component/admin/EditLoanPackageForm";
import ConfirmationModal from "../../component/ConfirmationModal";


// ... (Keep PackageActions and ViewPackageModal components as they are) ...
const PackageActions = ({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center justify-end space-x-2">
    <button
      onClick={onView}
      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
      title="View Package"
    >
      <EyeIcon className="w-5 h-5" />
    </button>
    <button
      onClick={onEdit}
      className="text-yellow-500 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-100 transition-colors"
      title="Edit Package"
    >
      <PencilIcon className="w-5 h-5" />
    </button>
    <button
      onClick={onDelete}
      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
      title="Delete Package"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  </div>
);

const ViewPackageModal = ({ isOpen, onClose, packageData, packageType }: { isOpen: boolean; onClose: () => void; packageData: FinancePackage | null; packageType: PackageType | null }) => {
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

            {/* Minimum Amount */}
            <div>
              <label className="block font-semibold mb-2">Minimum Amount</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                Rs. {packageData.minAmount?.toLocaleString()}
              </div>
            </div>

            {/* Description */}
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
            {/* Package Name */}
            <div>
              <label className="block font-semibold mb-2">Package Name</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                {packageData.name}
              </div>
            </div>

            {/* Interest Rate and Min Balance in one row */}
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

            {/* Description */}
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
            {/* Package Name */}
            <div>
              <label className="block font-semibold mb-2">Package Name</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                {packageData.name}
              </div>
            </div>

            {/* Interest Rate and Max Duration in one row */}
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

            {/* Maximum Amount */}
            <div>
              <label className="block font-semibold mb-2">Maximum Amount</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900">
                Rs. {packageData.maxAmount?.toLocaleString()}
              </div>
            </div>

            {/* Description */}
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

function AdminPackages() {
  const location = useLocation(); // Hook for navigation state
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [fixedDeposits, setFixedDeposits] = useState<FinancePackage[]>([]);
  const [savingAccounts, setSavingAccounts] = useState<FinancePackage[]>([]);
  const [loans, setLoans] = useState<FinancePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Add modals
  const [isAddFixedDepositModalOpen, setIsAddFixedDepositModalOpen] =
    useState(false);
  const [isAddSavingAccountModalOpen, setIsAddSavingAccountModalOpen] =
    useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);

  // ... (Rest of your state variables) ...
  const [isEditFixedDepositModalOpen, setIsEditFixedDepositModalOpen] =
    useState(false);
  const [isEditSavingAccountModalOpen, setIsEditSavingAccountModalOpen] =
    useState(false);
  const [isEditLoanModalOpen, setIsEditLoanModalOpen] = useState(false);
  const [viewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [currentPackageToView, setCurrentPackageToView] = useState<FinancePackage | null>(null);
  const [currentPackageType, setCurrentPackageType] = useState<PackageType | null>(null);
  const [currentEditPackage, setCurrentEditPackage] = useState<FinancePackage | null>(null);

  // Deletion confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; type: "fixed-deposits" | "saving-accounts" | "loan-packages" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: Effect to handle Global Search actions ---
  useEffect(() => {
    if (isRecord(location.state) && typeof location.state.action === "string") {
      const action = location.state.action;

      // Small timeout to ensure component is ready
      setTimeout(() => {
        if (action === "openAddFD") setIsAddFixedDepositModalOpen(true);
        if (action === "openAddSaving") setIsAddSavingAccountModalOpen(true);
        if (action === "openAddLoan") setIsAddLoanModalOpen(true);
      }, 100);

      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ... (Keep the rest of your existing code intact) ...

  // Fetch session sahakariId
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiFetch(`${apiBase}/session`);
        const data: unknown = await response.json();
        if (!isRecord(data) || (typeof data.sahakariId !== "string" && typeof data.sahakariId !== "number")) throw new Error("Invalid session response");
        setSelectedNetworkId(String(data.sahakariId));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Session failed to load");
      } finally {
        setSessionLoading(false);
      }
    };

    void fetchSession();
  }, []);

  // Fetch all finance data
  const fetchData = useCallback(async (networkId: string) => {
    setLoading(true);
    try {
      const [fdRes, saRes, lpRes] = await Promise.all([
        apiFetch(`${apiBase}/finance/fixed-deposits/${encodeURIComponent(networkId)}`),
        apiFetch(`${apiBase}/finance/saving-accounts/${encodeURIComponent(networkId)}`),
        apiFetch(`${apiBase}/finance/loan-packages/${encodeURIComponent(networkId)}`),
      ]);

      setFixedDeposits(parseFinancePackages(await fdRes.json()));
      setSavingAccounts(parseFinancePackages(await saRes.json()));
      setLoans(parseFinancePackages(await lpRes.json()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Packages failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNetworkId) {
      void fetchData(selectedNetworkId);
    }
  }, [fetchData, selectedNetworkId]);

  // Delete handler
  const handleDeletePackage = (id: string, type: "fixed-deposits" | "saving-accounts" | "loan-packages") => {
    setPackageToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    const { id, type } = packageToDelete;
    setIsDeleteModalOpen(false);
    setLoading(true);

    try {
      const url = `${apiBase}/finance/${type}/${encodeURIComponent(id)}`;
      await apiFetch(url, { method: "DELETE" });
      if (selectedNetworkId) await fetchData(selectedNetworkId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Package deletion failed");
    } finally {
      setLoading(false);
      setPackageToDelete(null);
    }
  };

  // View handler
  const handleViewPackage = (pkg: FinancePackage, type: PackageType) => {
    setCurrentPackageToView(pkg);
    setCurrentPackageType(type);
    setViewPackageModalOpen(true);
  };

  // Edit handlers
  const handleEditFixedDeposit = (pkg: FinancePackage) => {
    setCurrentEditPackage(pkg);
    setIsEditFixedDepositModalOpen(true);
  };

  const handleEditSavingAccount = (pkg: FinancePackage) => {
    setCurrentEditPackage(pkg);
    setIsEditSavingAccountModalOpen(true);
  };

  const handleEditLoan = (pkg: FinancePackage) => {
    setCurrentEditPackage(pkg);
    setIsEditLoanModalOpen(true);
  };

  // Handle form completion
  const handleAdded = () => {
    if (selectedNetworkId) void fetchData(selectedNetworkId);
    setIsAddFixedDepositModalOpen(false);
    setIsAddSavingAccountModalOpen(false);
    setIsAddLoanModalOpen(false);
  };

  const handleUpdated = () => {
    if (selectedNetworkId) void fetchData(selectedNetworkId);
    setIsEditFixedDepositModalOpen(false);
    setIsEditSavingAccountModalOpen(false);
    setIsEditLoanModalOpen(false);
    setCurrentEditPackage(null);
  };

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
          Unable to load session. Please login again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-3 md:p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
        {error && <p className="mb-4 text-red-600" role="alert">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                              onView={() =>
                                { handleViewPackage(pkg, "fixed-deposit"); }
                              }
                              onEdit={() => { handleEditFixedDeposit(pkg); }}
                              onDelete={() =>
                                { handleDeletePackage(pkg.id, "fixed-deposits"); }
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
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
                              onView={() =>
                                { handleViewPackage(pkg, "saving-account"); }
                              }
                              onEdit={() => { handleEditSavingAccount(pkg); }}
                              onDelete={() =>
                                { handleDeletePackage(pkg.id, "saving-accounts"); }
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
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
                              onView={() =>
                                { handleViewPackage(pkg, "loan-package"); }
                              }
                              onEdit={() => { handleEditLoan(pkg); }}
                              onDelete={() =>
                                { handleDeletePackage(pkg.id, "loan-packages"); }
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
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
      <div className="group fixed z-20 bottom-20 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 opacity-0 scale-90 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-in-out">
          <button
            title="Add Loan Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => { setIsAddLoanModalOpen(true); }}
          >
            <BanknotesIcon className="w-7 h-7" />
          </button>

          <button
            title="Add Saving Account Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => { setIsAddSavingAccountModalOpen(true); }}
          >
            <CurrencyDollarIcon className="w-7 h-7" />
          </button>

          <button
            title="Add Fixed Deposit Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => { setIsAddFixedDepositModalOpen(true); }}
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

      {/* Add Modals */}
      <Modal
        isOpen={isAddFixedDepositModalOpen}
        onClose={() => { setIsAddFixedDepositModalOpen(false); }}
        title="Add New Fixed Deposit Package"
        size="2xl"
      >
        <AddFixedDepositForm
          networkId={selectedNetworkId}
          onAdded={handleAdded}
          onClose={() => { setIsAddFixedDepositModalOpen(false); }}
        />
      </Modal>

      <Modal
        isOpen={isAddSavingAccountModalOpen}
        onClose={() => { setIsAddSavingAccountModalOpen(false); }}
        title="Add New Saving Account Package"
        size="2xl"
      >
        <AddSavingAccountForm
          networkId={selectedNetworkId}
          onAdded={handleAdded}
          onClose={() => { setIsAddSavingAccountModalOpen(false); }}
        />
      </Modal>

      <Modal
        isOpen={isAddLoanModalOpen}
        onClose={() => { setIsAddLoanModalOpen(false); }}
        title="Add New Loan Package"
        size="2xl"
      >
        <AddLoanForm
          networkId={selectedNetworkId}
          onAdded={handleAdded}
          onClose={() => { setIsAddLoanModalOpen(false); }}
        />
      </Modal>

      {/* Edit Modals */}
      <Modal
        isOpen={isEditFixedDepositModalOpen}
        onClose={() => {
          setIsEditFixedDepositModalOpen(false);
          setCurrentEditPackage(null);
        }}
        title="Edit Fixed Deposit Package"
        size="2xl"
      >
        {currentEditPackage && (
          <EditFixedDepositForm
            initialData={currentEditPackage}
            onClose={() => {
              setIsEditFixedDepositModalOpen(false);
              setCurrentEditPackage(null);
            }}
            onUpdated={handleUpdated}
          />
        )}
      </Modal>

      <Modal
        isOpen={isEditSavingAccountModalOpen}
        onClose={() => {
          setIsEditSavingAccountModalOpen(false);
          setCurrentEditPackage(null);
        }}
        title="Edit Saving Account Package"
        size="2xl"
      >
        {currentEditPackage && (
          <EditSavingAccountForm
            initialData={currentEditPackage}
            onClose={() => {
              setIsEditSavingAccountModalOpen(false);
              setCurrentEditPackage(null);
            }}
            onUpdated={handleUpdated}
          />
        )}
      </Modal>

      <Modal
        isOpen={isEditLoanModalOpen}
        onClose={() => {
          setIsEditLoanModalOpen(false);
          setCurrentEditPackage(null);
        }}
        title="Edit Loan Package"
        size="2xl"
      >
        {currentEditPackage && (
          <EditLoanPackageForm
            initialData={currentEditPackage}
            onClose={() => {
              setIsEditLoanModalOpen(false);
              setCurrentEditPackage(null);
            }}
            onUpdated={handleUpdated}
          />
        )}
      </Modal>

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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPackageToDelete(null);
        }}
        onConfirm={() => { void confirmDelete(); }}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${packageToDelete?.type.replace("-", " ") ?? "financial"} package? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

export default AdminPackages;
