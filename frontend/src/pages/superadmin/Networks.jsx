import React, { useState } from 'react';
import { 
  SearchIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusCircleIcon, 
  BuildingIcon,
  UserCircleIcon,
  DocumentIcon
} from '../../component/icons.jsx';

// --- ADDED IMPORTS ---
// We now import the components you already built
import Modal from '../../component/superadmin/Modal.jsx';
import AddNetworkForm from '../../component/superadmin/AddNetworkForm.jsx';
import AddUserForm from '../../component/superadmin/AddUserForm.jsx';

// --- MOCK DATA ---
const networks = [
  { 
    id: 1, 
    registeredId: 'N-12345', 
    name: 'Sahakari 1', 
    address: 'Kathmandu, Nepal', 
    createdAt: '13-Apr-2025',
    phone: '01-5551234',
    staffCount: 15,
    userCount: 1200,
    regDocuments: [
      { name: 'registration_cert.pdf', url: '#' },
      { name: 'tax_clearance.pdf', url: '#' },
    ]
  },
  { 
    id: 2, 
    registeredId: 'N-67890', 
    name: 'Sahakari 2', 
    address: 'Lalitpur, Nepal', 
    createdAt: '12-Apr-2025',
    phone: '01-5555678',
    staffCount: 8,
    userCount: 850,
    regDocuments: [
      { name: 'registration_cert.pdf', url: '#' },
    ]
  },
  { 
    id: 3, 
    registeredId: 'N-24680', 
    name: 'Geda Sahakari', 
    address: 'Bhaktapur, Nepal', 
    createdAt: '11-Apr-2025',
    phone: '01-6661111',
    staffCount: 12,
    userCount: 2500,
    regDocuments: [
      { name: 'registration_cert.pdf', url: '#' },
      { name: 'tax_clearance.pdf', url: '#' },
    ]
  },
  { 
    id: 4, 
    registeredId: 'N-13579', 
    name: 'Janata Sahakari', 
    address: 'Pokhara, Nepal', 
    createdAt: '10-Apr-2025',
    phone: '061-500200',
    staffCount: 20,
    userCount: 5000,
    regDocuments: [
      { name: 'registration_cert.pdf', url: '#' },
    ]
  },
];

const users = [
  { 
    id: 1, 
    name: 'Asal Admin', 
    email: 'asal@example.com', 
    phone: '9800000001', 
    sahakari: 'Sahakari 1', 
    role: 'admin',
    status: 'Active',
    documents: [
      { name: 'citizenship.pdf', url: '#' },
      { name: 'photo.jpg', url: '#' },
    ]
  },
  { 
    id: 2, 
    name: 'Barshat Admin', 
    email: 'barshat@example.com', 
    phone: '9800000002', 
    sahakari: 'Sahakari 2', 
    role: 'admin',
    status: 'Pending',
    documents: [
      { name: 'citizenship.pdf', url: '#' },
    ]
  },
  { 
    id: 3, 
    name: 'Ram Member', 
    email: 'ram@example.com', 
    phone: '9800000003', 
    sahakari: 'Sahakari 1', 
    role: 'member',
    status: 'Active',
    documents: [
      { name: 'citizenship.pdf', url: '#' },
      { name: 'photo.jpg', url: '#' },
    ]
  },
  { 
    id: 4, 
    name: 'Sita Staff', 
    email: 'sita@example.com', 
    phone: '9800000004', 
    sahakari: 'Geda Sahakari', 
    role: 'staff',
    status: 'Suspended',
    documents: [
      { name: 'citizenship.pdf', url: '#' },
    ]
  },
  { 
    id: 5, 
    name: 'Hari Member', 
    email: 'hari@example.com', 
    phone: '9800000005', 
    sahakari: 'Janata Sahakari', 
    role: 'member',
    status: 'Active',
    documents: [
      { name: 'citizenship.pdf', url: '#' },
      { name: 'photo.jpg', url: '#' },
    ]
  },
];


// --- 1. REUSABLE MODAL COMPONENT ---
// [REMOVED - Now imported from ../../component/superadmin/Modal.jsx]


// --- 2. ADD NETWORK FORM COMPONENT ---
// [REMOVED - Now imported from ../../component/superadmin/AddNetworkForm.jsx]


// --- 3. ADD USER FORM COMPONENT ---
// [REMOVED - Now imported from ../../component/superadmin/AddUserForm.jsx]


// --- 4. DETAIL VIEW COMPONENTS ---

// Component for a single detail item in the modal
const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-sm font-semibold text-gray-500 block">{label}</span>
    <span className="text-lg text-gray-800">{value}</span>
  </div>
);

// Component for a document link
const DocumentLink = ({ doc }) => (
  <a
    href={doc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline"
  >
    <DocumentIcon className="w-4 h-4" />
    <span className="text-sm font-medium">{doc.name}</span>
  </a>
);

// A component to display Network details
const NetworkDetails = ({ item }) => (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
    {/* Left Side: Image Box */}
    <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <BuildingIcon className="w-24 h-24 text-gray-400" />
    </div>
    
    {/* Right Side: Details */}
    <div className="flex-1 space-y-5">
      <h3 className="text-3xl font-bold mb-2">{item.name}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <DetailItem label="Registered ID" value={item.registeredId} />
        <DetailItem label="Address" value={item.address} />
        <DetailItem label="Phone Number" value={item.phone} />
        <DetailItem label="Created At" value={item.createdAt} />
        <DetailItem label="Staff Count" value={item.staffCount} />
        <DetailItem label="User Count" value={item.userCount.toLocaleString('en-IN')} />
      </div>
      <div>
        <span className="text-sm font-semibold text-gray-500 block mb-2">Registration Documents</span>
        <div className="flex flex-col gap-1.5">
          {item.regDocuments.map((doc, index) => (
            <DocumentLink key={index} doc={doc} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// A component to display User details
const UserDetails = ({ item }) => (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
    {/* Left Side: Image Box (Avatar) */}
    <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
      <UserCircleIcon className="w-28 h-28 text-gray-400" />
    </div>
    
    {/* Right Side: Details */}
    <div className="flex-1 space-y-5">
      <div>
        <h3 className="text-3xl font-bold">{item.name}</h3>
        <span className="text-lg text-teal-600 font-semibold capitalize block">{item.role}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <DetailItem label="User ID" value={item.id} />
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Status</span>
          <span className={`text-lg font-bold
            ${item.status === 'Active' ? 'text-green-600' : ''}
            ${item.status === 'Pending' ? 'text-yellow-600' : ''}
            ${item.status === 'Suspended' ? 'text-red-600' : ''}
          `}>
            {item.status}
          </span>
        </div>
        <DetailItem label="Email" value={item.email} />
        <DetailItem label="Phone" value={item.phone} />
        <div className="col-span-2">
          <DetailItem label="Associated Sahakari" value={item.sahakari} />
        </div>
      </div>
      <div>
        <span className="text-sm font-semibold text-gray-500 block mb-2">Uploaded Documents</span>
        <div className="flex flex-col gap-1.5">
          {item.documents.map((doc, index) => (
            <DocumentLink key={index} doc={doc} />
          ))}
        </div>
      </div>
    </div>
  </div>
);


// --- 5. MAIN NETWORKS PAGE COMPONENT ---
function Networks() {
  // State to manage which table view is active: 'networks' or 'users'
  const [activeView, setActiveView] = useState('networks');
  
  // State for the "View Details" modal
  const [viewModalItem, setViewModalItem] = useState(null); 
  // State for the "Add Network" modal
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  // State for the "Add User" modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Helper function to determine button styles
  const getButtonClass = (viewName) => {
    return activeView === viewName
      ? 'bg-teal-500 text-white' // Active style
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; // Inactive style
  };

  // --- MODAL HANDLER FUNCTIONS ---
  
  // Opens the modal and sets the selected item
  const handleViewClick = (item) => {
    setViewModalItem(item);
  };

  // Closes the modal and clears the selected item
  const handleCloseViewModal = () => {
    setViewModalItem(null);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh]">
        <h2 className="text-2xl font-bold mb-6">Active Network</h2>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-6 w-6 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-12 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('networks')}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass('networks')}`}
            >
              Networks
            </button>
            <button 
              onClick={() => setActiveView('users')}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass('users')}`}
            >
              Users
            </button>
          </div>
        </div>

        {/* CONDITIONAL TABLE: NETWORKS */}
        {activeView === 'networks' && (
          <div className="space-y-2">
            {/* List Header - Networks */}
            <div className="grid grid-cols-6 gap-4 items-center bg-gray-50 p-4 rounded-lg font-semibold text-gray-600">
              <span>Registered ID</span>
              <span className="col-span-2">Name</span>
              <span>Address</span>
              <span>Created At</span>
              <span className="text-right">Action</span>
            </div>

            {/* List Body - Networks */}
            {networks.map((network) => (
              <div 
                key={network.id} 
                className="grid grid-cols-6 gap-4 items-center bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-600 font-medium">{network.registeredId}</span>
                <span className="text-gray-800 font-bold col-span-2">{network.name}</span>
                <span className="text-gray-700">{network.address}</span>
                <span className="text-gray-700">{network.createdAt}</span>
                
                {/* Action Icons */}
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => handleViewClick(network)}
                    className="text-blue-500 hover:text-blue-700" 
                    title="View"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button className="text-yellow-500 hover:text-yellow-700" title="Edit">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button className="text-red-500 hover:text-red-700" title="Delete">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONDITIONAL TABLE: USERS */}
        {activeView === 'users' && (
          <div className="space-y-2">
            {/* List Header - Users */}
            <div className="grid grid-cols-7 gap-4 items-center bg-gray-50 p-4 rounded-lg font-semibold text-gray-600">
              <span>ID</span>
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Associated Sahakari</span>
              <span>Role</span>
              <span className="text-right">Action</span>
            </div>

            {/* List Body - Users */}
            {users.map((user) => (
              <div 
                key={user.id} 
                className="grid grid-cols-7 gap-4 items-center bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-600 font-medium">{user.id}</span>
                <span className="text-gray-800 font-bold">{user.name}</span>
                <span className="text-gray-700 truncate">{user.email}</span>
                <span className="text-gray-700">{user.phone}</span>
                <span className="text-gray-700 truncate">{user.sahakari}</span>
                <span className="text-gray-700 capitalize">{user.role}</span>
                
                {/* Action Icons */}
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => handleViewClick(user)}
                    className="text-blue-500 hover:text-blue-700" 
                    title="View"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button className="text-yellow-500 hover:text-yellow-700" title="Edit">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button className="text-red-500 hover:text-red-700" title="Delete">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        
        {/* Pop-up Options Container */}
        <div 
          className="flex flex-col items-center gap-3 
                     opacity-0 scale-90 translate-y-4 
                     group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 
                     pointer-events-none group-hover:pointer-events-auto
                     transition-all duration-200 ease-in-out"
        >
          
          {/* Add User Button */}
          <button
            title="Add User"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <UserCircleIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add User
            </span>
          </button>

          {/* Add Sahakari Button */}
          <button
            title="Add Sahakari"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddNetworkModalOpen(true)}
          >
            <BuildingIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Sahakari
            </span>
          </button>
        </div>

        {/* Main FAB Button */}
        <button
          title="Add"
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>


      {/* MODAL DEFINITIONS */}

      {/* View Details Modal */}
      <Modal 
        isOpen={!!viewModalItem} 
        onClose={handleCloseViewModal} 
        title={activeView === 'networks' ? 'Network Details' : 'User Details'}
        size="3xl"
      >
        {viewModalItem && (
          activeView === 'networks' 
            ? <NetworkDetails item={viewModalItem} />
            : <UserDetails item={viewModalItem} />
        )}
      </Modal>

      {/* Add Network Modal */}
      <Modal 
        isOpen={isAddNetworkModalOpen} 
        onClose={() => setIsAddNetworkModalOpen(false)} 
        title="Add New Sahakari"
        size="2xl" 
      >
        <AddNetworkForm onClose={() => setIsAddNetworkModalOpen(false)} />
      </Modal>

      {/* Add User Modal */}
      <Modal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)} 
        title="Add New User"
        size="2xl"
      >
        <AddUserForm onClose={() => setIsAddUserModalOpen(false)} />
      </Modal>
    </>
  );
}

export default Networks;