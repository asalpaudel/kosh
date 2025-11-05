import React, { useState } from 'react';
import { 
  SearchIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusCircleIcon, 
  CloseIcon,
  BuildingIcon,  // <-- IMPORTED
  UserCircleIcon // <-- IMPORTED
} from '../../component/icons.jsx';

// Mock data for the network list
const networks = [
  { id: 1, registeredId: 'N-12345', name: 'Sahakari 1', address: 'Kathmandu, Nepal', createdAt: '13-Apr-2025' },
  { id: 2, registeredId: 'N-67890', name: 'Sahakari 2', address: 'Lalitpur, Nepal', createdAt: '12-Apr-2025' },
  { id: 3, registeredId: 'N-24680', name: 'Geda Sahakari', address: 'Bhaktapur, Nepal', createdAt: '11-Apr-2025' },
  { id: 4, registeredId: 'N-13579', name: 'Janata Sahakari', address: 'Pokhara, Nepal', createdAt: '10-Apr-2025' },
];

// Mock data for the user list
const users = [
  { id: 1, name: 'Asal Admin', email: 'asal@example.com', phone: '9800000001', sahakari: 'Sahakari 1', role: 'admin' },
  { id: 2, name: 'Barshat Admin', email: 'barshat@example.com', phone: '9800000002', sahakari: 'Sahakari 2', role: 'admin' },
  { id: 3, name: 'Ram Member', email: 'ram@example.com', phone: '9800000003', sahakari: 'Sahakari 1', role: 'member' },
  { id: 4, name: 'Sita Staff', email: 'sita@example.com', phone: '9800000004', sahakari: 'Geda Sahakari', role: 'staff' },
  { id: 5, name: 'Hari Member', email: 'hari@example.com', phone: '9800000005', sahakari: 'Janata Sahakari', role: 'member' },
];

// --- MODAL CONTENT COMPONENTS (UPDATED) ---

// A component to display Network details with better UI
const NetworkDetails = ({ item, onClose }) => (
  <div className="flex flex-col sm:flex-row gap-6">
    {/* Left Side: Image Box */}
    <div className="flex-shrink-0 w-full sm:w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
      <BuildingIcon className="w-20 h-20 text-gray-400" />
    </div>
    
    {/* Right Side: Details */}
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-4">{item.name}</h3>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Registered ID</span>
          <span className="text-lg text-gray-800">{item.registeredId}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Address</span>
          <span className="text-lg text-gray-800">{item.address}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Created At</span>
          <span className="text-lg text-gray-800">{item.createdAt}</span>
        </div>
      </div>
      {/* --- Close button removed --- */}
    </div>
  </div>
);

// A component to display User details with better UI
const UserDetails = ({ item, onClose }) => (
  <div className="flex flex-col sm:flex-row gap-6">
    {/* Left Side: Image Box (Avatar) */}
    <div className="flex-shrink-0 w-full sm:w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center">
      <UserCircleIcon className="w-24 h-24 text-gray-400" />
    </div>
    
    {/* Right Side: Details */}
    <div className="flex-1">
      <h3 className="text-2xl font-bold mb-1">{item.name}</h3>
      <span className="text-md text-teal-600 font-semibold capitalize mb-4 block">{item.role}</span>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Email</span>
          <span className="text-lg text-gray-800">{item.email}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Phone</span>
          <span className="text-lg text-gray-800">{item.phone}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 block">Associated Sahakari</span>
          <span className="text-lg text-gray-800">{item.sahakari}</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-500 block">User ID</span>
          <span className="text-lg text-gray-800">{item.id}</span>
        </div>
      </div>
      {/* --- Close button removed --- */}
    </div>
  </div>
);


function Networks() {
  // State to manage which table view is active: 'networks' or 'users'
  const [activeView, setActiveView] = useState('networks');
  
  // --- STATE FOR MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Helper function to determine button styles
  const getButtonClass = (viewName) => {
    return activeView === viewName
      ? 'bg-black text-white' // Active style
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'; // Inactive style
  };

  // --- MODAL HANDLER FUNCTIONS ---
  
  // Opens the modal and sets the selected item
  const handleViewClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Closes the modal and clears the selected item
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
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
          
          {/* Filter Buttons - Now functional */}
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

      {/* --- MODIFIED FLOATING ACTION BUTTON --- */}
      {/* FAB Group Wrapper */}
      {/* Note: Added 'group' class for hover state detection in CSS */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        
        {/* Pop-up Options Container */}
        {/* Hidden by default, scales in and fades in on group-hover */}
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
            onClick={() => alert('Add User Clicked!')} // Placeholder action
          >
            <UserCircleIcon className="w-7 h-7" />
            {/* Tooltip */}
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add User
            </span>
          </button>

          {/* Add Sahakari Button */}
          <button
            title="Add Sahakari"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => alert('Add Sahakari Clicked!')} // Placeholder action
          >
            <BuildingIcon className="w-7 h-7" />
            {/* Tooltip */}
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
          {/* Icon is bigger (w-10 h-10) and uses 'fab-icon' class for CSS rotation */}
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>
      {/* --- END OF MODIFIED FAB --- */}


      {/* --- MODAL POP-UP --- */}
      {isModalOpen && (
        <div 
          // The overlay: covers the whole screen, blurs background
          // --- UPDATED: Removed bg-black/50, replaced with bg-black/10 for a subtle blur ---
          className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-[3px] p-4"
          onClick={handleCloseModal} // Click outside the box to close
        >
          <div
            // The modal "box": white background, rounded, shadow
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl" // <-- UPDATED WIDTH
            onClick={(e) => e.stopPropagation()} // Prevents closing modal when clicking *inside* the box
          >
            {/* Conditionally render the correct details */}
            {activeView === 'networks' 
              ? <NetworkDetails item={selectedItem} onClose={handleCloseModal} />
              : <UserDetails item={selectedItem} onClose={handleCloseModal} />
            }
          </div>
        </div>
      )}
    </>
  );
}

export default Networks;