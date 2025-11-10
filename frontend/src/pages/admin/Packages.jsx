import React, { useState } from 'react';
import { 
  PlusCircleIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '../../component/icons.jsx';
import Modal from '../../component/superadmin/Modal.jsx';
import AddFixedDepositForm from '../../component/admin/AddFixedDepositForm.jsx';
import AddSavingAccountForm from '../../component/admin/AddSavingAccountForm.jsx';
import AddLoanForm from '../../component/admin/AddLoanForm.jsx';

const mockPackages = {
  fixedDeposits: [
    { id: 'fd-1', name: 'FD 1', description: 'Standard Fixed Deposit Package' },
    { id: 'fd-2', name: 'FD 2', description: 'Premium Fixed Deposit Package' },
  ],
  savingAccounts: [
    { id: 'sa-1', name: 'Type 1', description: 'Basic Saving Account' },
  ],
  loans: [
    { id: 'l-1', name: 'Loan 1', description: 'Personal Loan Package' },
    { id: 'l-2', name: 'Loan 2', description: 'Home Loan Package' },
  ],
};

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

function AdminPackages() {
  const [isAddFixedDepositModalOpen, setIsAddFixedDepositModalOpen] = useState(false);
  const [isAddSavingAccountModalOpen, setIsAddSavingAccountModalOpen] = useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  
  const [viewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [currentPackageToView, setCurrentPackageToView] = useState(null);

  const handleViewPackage = (pkg) => {
    setCurrentPackageToView(pkg);
    setViewPackageModalOpen(true);
  };
  const handleEditPackage = (pkg) => {
    alert(`Edit package: ${pkg.name} (ID: ${pkg.id})`);
  };
  const handleDeletePackage = (id) => {
    if (window.confirm(`Are you sure you want to delete package ID: ${id}?`)) {
      alert(`Deleting package ID: ${id}`);
    }
  };

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
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
                    <th className="py-2 px-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPackages.fixedDeposits.length > 0 ? (
                    mockPackages.fixedDeposits.map(pkg => (
                      <tr key={pkg.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-3 px-2 text-gray-800 font-medium">{pkg.name}</td>
                        <td className="py-3 px-2">
                          <PackageActions 
                            pkg={pkg}
                            onView={handleViewPackage}
                            onEdit={handleEditPackage}
                            onDelete={handleDeletePackage}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-8 text-center text-gray-400">
                        No Fixed Deposit Packages
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                    <th className="py-2 px-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPackages.savingAccounts.length > 0 ? (
                    mockPackages.savingAccounts.map(pkg => (
                      <tr key={pkg.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-3 px-2 text-gray-800 font-medium">{pkg.name}</td>
                        <td className="py-3 px-2">
                          <PackageActions 
                            pkg={pkg}
                            onView={handleViewPackage}
                            onEdit={handleEditPackage}
                            onDelete={handleDeletePackage}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-8 text-center text-gray-400">
                        No Saving Account Packages
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                    <th className="py-2 px-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPackages.loans.length > 0 ? (
                    mockPackages.loans.map(pkg => (
                      <tr key={pkg.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="py-3 px-2 text-gray-800 font-medium">{pkg.name}</td>
                        <td className="py-3 px-2">
                          <PackageActions 
                            pkg={pkg}
                            onView={handleViewPackage}
                            onEdit={handleEditPackage}
                            onDelete={handleDeletePackage}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-8 text-center text-gray-400">
                        No Loan Packages
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        
        <div 
          className="flex flex-col items-center gap-3 
                     opacity-0 scale-90 translate-y-4 
                     group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 
                     pointer-events-none group-hover:pointer-events-auto
                     transition-all duration-200 ease-in-out"
        >
          
          <button
            title="Add Loan Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddLoanModalOpen(true)}
          >
            <BanknotesIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Loan
            </span>
          </button>

          <button
            title="Add Saving Account Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddSavingAccountModalOpen(true)}
          >
            <CurrencyDollarIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Saving
            </span>
          </button>

          <button
            title="Add Fixed Deposit Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddFixedDepositModalOpen(true)}
          >
            <DocumentTextIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Fixed Deposit
            </span>
          </button>
        </div>

        <button
          title="Add"
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      <Modal 
        isOpen={isAddFixedDepositModalOpen} 
        onClose={() => setIsAddFixedDepositModalOpen(false)} 
        title="Add New Fixed Deposit Package"
        size="2xl"
      >
        <AddFixedDepositForm onClose={() => setIsAddFixedDepositModalOpen(false)} />
      </Modal>

      <Modal 
        isOpen={isAddSavingAccountModalOpen} 
        onClose={() => setIsAddSavingAccountModalOpen(false)} 
        title="Add New Saving Account Package"
        size="2xl"
      >
        <AddSavingAccountForm onClose={() => setIsAddSavingAccountModalOpen(false)} />
      </Modal>

      <Modal 
        isOpen={isAddLoanModalOpen} 
        onClose={() => setIsAddLoanModalOpen(false)} 
        title="Add New Loan Package"
        size="2xl"
      >
        <AddLoanForm onClose={() => setIsAddLoanModalOpen(false)} />
      </Modal>
      
      <Modal
        isOpen={viewPackageModalOpen}
        onClose={() => setViewPackageModalOpen(false)}
        title={currentPackageToView ? `Details: ${currentPackageToView.name}` : 'Package Details'}
        size="lg" 
      >
        {currentPackageToView ? (
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">{currentPackageToView.name}</h3>
            <p className="text-gray-700 mb-2">{currentPackageToView.description}</p>
            <p className="text-sm text-gray-500 mt-2">Package Type: {currentPackageToView.type}</p>
            <p className="text-sm text-gray-500 mt-2">Package ID: {currentPackageToView.id}</p>
            <button
              onClick={() => setViewPackageModalOpen(false)}
              className="mt-6 bg-teal-500 text-white py-2 px-4 rounded-full hover:bg-teal-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <p className="p-4">No package selected.</p>
        )}
      </Modal>
    </>
  );
}

export default AdminPackages;