import React, { useState, useMemo } from 'react';
import { 
  PlusCircleIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon, // For Fixed Deposit
  CurrencyDollarIcon, // For Saving Account
  BanknotesIcon // For Loan Packages
} from '../../component/icons.jsx'; // Assuming icons are here

// Re-using the Superadmin's Modal component
import Modal from '../../component/superadmin/Modal.jsx'; 

// Mock Data for Packages
const mockPackages = {
  fixedDeposits: [
    { id: 1, name: 'FD 1', description: 'Standard Fixed Deposit Package' },
    { id: 2, name: 'FD 2', description: 'Premium Fixed Deposit Package' },
  ],
  savingAccounts: [
    { id: 1, name: 'Type 1', description: 'Basic Saving Account' },
  ],
  loans: [
    { id: 1, name: 'Loan 1', description: 'Personal Loan Package' },
    { id: 2, name: 'Loan 2', description: 'Home Loan Package' },
  ],
};

const PackageItem = ({ packageData, onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm mb-3 border border-gray-100 hover:border-teal-300 transition-colors">
    <span className="text-gray-800 font-medium">{packageData.name}</span>
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => onView(packageData)}
        className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
        title="View Package"
      >
        <EyeIcon className="w-5 h-5" />
      </button>
      <button 
        onClick={() => onEdit(packageData)}
        className="text-yellow-500 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-100 transition-colors"
        title="Edit Package"
      >
        <PencilIcon className="w-5 h-5" />
      </button>
      <button 
        onClick={() => onDelete(packageData.id)}
        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
        title="Delete Package"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);

function Packages() {
  const [isAddFixedDepositModalOpen, setIsAddFixedDepositModalOpen] = useState(false);
  const [isAddSavingAccountModalOpen, setIsAddSavingAccountModalOpen] = useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  
  const [viewPackageModalOpen, setViewPackageModalOpen] = useState(false);
  const [currentPackageToView, setCurrentPackageToView] = useState(null);

  // Placeholder functions for actions
  const handleViewPackage = (pkg) => {
    console.log('Viewing package:', pkg);
    setCurrentPackageToView(pkg);
    setViewPackageModalOpen(true);
  };
  const handleEditPackage = (pkg) => {
    alert(`Edit package: ${pkg.name} (ID: ${pkg.id})`);
    console.log('Editing package:', pkg);
  };
  const handleDeletePackage = (id) => {
    if (window.confirm(`Are you sure you want to delete package ID: ${id}?`)) {
      alert(`Deleting package ID: ${id}`);
      console.log('Deleting package ID:', id);
      // In a real app, you'd dispatch an action or make an API call here
    }
  };

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-lg"> 
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Packages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fixed Deposit Packages Column */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">Fix Deposit Packages</h3>
            {mockPackages.fixedDeposits.length > 0 ? (
              mockPackages.fixedDeposits.map(pkg => (
                <PackageItem 
                  key={pkg.id} 
                  packageData={pkg} 
                  onView={handleViewPackage}
                  onEdit={handleEditPackage} 
                  onDelete={handleDeletePackage} 
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No Fixed Deposit Packages.</p>
            )}
          </div>

          {/* Saving Account Packages Column */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">Saving Account Packages</h3>
            {mockPackages.savingAccounts.length > 0 ? (
              mockPackages.savingAccounts.map(pkg => (
                <PackageItem 
                  key={pkg.id} 
                  packageData={pkg} 
                  onView={handleViewPackage}
                  onEdit={handleEditPackage} 
                  onDelete={handleDeletePackage} 
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No Saving Account Packages.</p>
            )}
          </div>

          {/* Loan Packages Column */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">Loan Packages</h3>
            {mockPackages.loans.length > 0 ? (
              mockPackages.loans.map(pkg => (
                <PackageItem 
                  key={pkg.id} 
                  packageData={pkg} 
                  onView={handleViewPackage}
                  onEdit={handleEditPackage} 
                  onDelete={handleDeletePackage} 
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No Loan Packages.</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for adding packages */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        {/* Pop-up Options Container */}
        <div
          className="flex flex-col items-center gap-3
                     opacity-0 scale-90 translate-y-4
                     group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
                     pointer-events-none group-hover:pointer-events-auto
                     transition-all duration-200 ease-in-out"
        >
          {/* Add Loan Package Button */}
          <button
            title="Add Loan Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddLoanModalOpen(true)}
          >
            <BanknotesIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Loan Package
            </span>
          </button>

          {/* Add Saving Account Package Button */}
          <button
            title="Add Saving Account Package"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddSavingAccountModalOpen(true)}
          >
            <CurrencyDollarIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Saving Account
            </span>
          </button>

          {/* Add Fixed Deposit Package Button */}
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

        {/* Main FAB Button */}
        <button
          title="Add Package"
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      {/* Modals for Add Package */}
      <Modal 
        isOpen={isAddFixedDepositModalOpen} 
        onClose={() => setIsAddFixedDepositModalOpen(false)} 
        title="Add New Fixed Deposit Package"
        size="2xl"
      >
        <div className="p-4">
          <p>Fixed Deposit package form will go here.</p>
          <button 
            onClick={() => setIsAddFixedDepositModalOpen(false)}
            className="mt-4 bg-teal-500 text-white py-2 px-4 rounded-full"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddSavingAccountModalOpen} 
        onClose={() => setIsAddSavingAccountModalOpen(false)} 
        title="Add New Saving Account Package"
        size="2xl"
      >
        <div className="p-4">
          <p>Saving Account package form will go here.</p>
          <button 
            onClick={() => setIsAddSavingAccountModalOpen(false)}
            className="mt-4 bg-teal-500 text-white py-2 px-4 rounded-full"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddLoanModalOpen} 
        onClose={() => setIsAddLoanModalOpen(false)} 
        title="Add New Loan Package"
        size="2xl"
      >
        <div className="p-4">
          <p>Loan package form will go here.</p>
          <button 
            onClick={() => setIsAddLoanModalOpen(false)}
            className="mt-4 bg-teal-500 text-white py-2 px-4 rounded-full"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Modal for Viewing Package Details */}
      <Modal
        isOpen={viewPackageModalOpen}
        onClose={() => setViewPackageModalOpen(false)}
        title={currentPackageToView ? `Details: ${currentPackageToView.name}` : 'Package Details'}
        size="lg"
      >
        {currentPackageToView ? (
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">{currentPackageToView.name}</h3>
            <p className="text-gray-700">{currentPackageToView.description}</p>
            <p className="text-sm text-gray-500 mt-2">Package ID: {currentPackageToView.id}</p>
            {/* Add more package details here */}
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

export default Packages;