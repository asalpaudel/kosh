import React, { useState, useEffect } from 'react'; // <-- Add useEffect
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

import Modal from '../../component/superadmin/Modal.jsx';
import AddNetworkForm from '../../component/superadmin/AddNetworkForm.jsx';
import EditNetworkForm from '../../component/superadmin/EditNetworkForm.jsx';

const API_BASE = 'http://localhost:8080/api';

// --- USERS MOCK (unchanged) ---
const users = [
  // ... (your mock user data)
];

// --- (DetailItem, DocumentLink, NetworkDetails, UserDetails components are all correct) ---
const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-sm font-semibold text-gray-500 block">{label}</span>
    <span className="text-lg text-gray-800">{value ?? '-'}</span>
  </div>
);
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
const NetworkDetails = ({ item }) => (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
    <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <BuildingIcon className="w-24 h-24 text-gray-400" />
    </div>
    <div className="flex-1 space-y-5">
      <h3 className="text-3xl font-bold mb-2">{item.name}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <DetailItem label="Registered ID" value={item.registeredId} />
        <DetailItem label="Address" value={item.address} />
        <DetailItem label="Phone Number" value={item.phone} />
        <DetailItem label="Created At" value={item.createdAt} />
        <DetailItem label="Staff Count" value={item.staffCount} />
        <DetailItem label="User Count" value={item.userCount?.toLocaleString?.('en-IN') ?? item.userCount} />
      </div>
      {!!item.regDocuments?.length && (
        <div>
          <span className="text-sm font-semibold text-gray-500 block mb-2">Registration Documents</span>
          <div className="flex flex-col gap-1.5">
            {item.regDocuments.map((doc, index) => (
              <DocumentLink key={index} doc={doc} />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);
const UserDetails = ({ item }) => (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
    <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
      <UserCircleIcon className="w-28 h-28 text-gray-400" />
    </div>
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

// --- MAIN PAGE ---
function Networks() {
  const [activeView, setActiveView] = useState('networks');
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalItem, setViewModalItem] = useState(null); 
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  
  // --- STATES FOR EDIT MODAL (WERE MISSING) ---
  const [isEditNetworkModalOpen, setIsEditNetworkModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // --- ADDED: useEffect to fetch network data ---
  useEffect(() => {
    if (activeView === 'networks') {
      const fetchNetworks = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE}/networks`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setNetworks(data);
        } catch (error) {
          console.error("Failed to fetch networks:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchNetworks();
    }
  }, [activeView]); // Re-fetch if activeView changes back to 'networks'

  const getButtonClass = (viewName) => {
    return activeView === viewName
      ? 'bg-black text-white' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  // --- MODAL HANDLER FUNCTIONS (WERE MISSING) ---
  const handleViewClick = (item) => setViewModalItem(item);
  const handleCloseViewModal = () => setViewModalItem(null);

  const openEdit = (network) => {
    setEditingNetwork(network);
    setIsEditNetworkModalOpen(true);
  };

  const handleAddSuccess = (newNetwork) => {
    setNetworks((prev) => [...prev, newNetwork]);
    setIsAddNetworkModalOpen(false);
  };

  const handleEditSuccess = (updatedNetwork) => {
    setNetworks((prev) => 
      prev.map((n) => (n.id === updatedNetwork.id ? updatedNetwork : n))
    );
    setIsEditNetworkModalOpen(false);
  };

  const deleteNetwork = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sahakari?')) return;
    try {
      const res = await fetch(`${API_BASE}/networks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      setNetworks((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Delete failed. See console for details.');
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh]">
        <h2 className="text-2xl font-bold mb-6">Active Network</h2>

        {/* ... (Search and Filter Bar) ... */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
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
            <div className="grid grid-cols-6 gap-4 items-center bg-gray-50 p-4 rounded-lg font-semibold text-gray-600">
              <span>Registered ID</span>
              <span className="col-span-2">Name</span>
              <span>Address</span>
              <span>Created At</span>
              <span className="text-right">Action</span>
            </div>
            {loading && (
              <div className="p-4 text-sm text-gray-500 text-center">Loading networks…</div>
            )}
            {!loading && networks.length === 0 && (
              <div className="p-4 text-sm text-gray-500 text-center">No networks found.</div>
            )}
            {!loading && networks.map((network) => (
              <div 
                key={network.id} 
                className="grid grid-cols-6 gap-4 items-center bg-white p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-600 font-medium">{network.registeredId}</span>
                <span className="text-gray-800 font-bold col-span-2">{network.name}</span>
                <span className="text-gray-700">{network.address}</span>
                <span className="text-gray-700">{network.createdAt}</span>
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => handleViewClick(network)}
                    className="text-blue-500 hover:text-blue-700" 
                    title="View"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEdit(network)}
                    className="text-yellow-500 hover:text-yellow-700"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteNetwork(network.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
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
            <div className="grid grid-cols-7 gap-4 items-center bg-gray-50 p-4 rounded-lg font-semibold text-gray-600">
              <span>ID</span>
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Associated Sahakari</span>
              <span>Role</span>
              <span className="text-right">Action</span>
            </div>
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
                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => setViewModalItem(user)}
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

      {/* ... (FAB) ... */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        <div 
          className="flex flex-col items-center gap-3 
                     opacity-0 scale-90 translate-y-4 
                     group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 
                     pointer-events-none group-hover:pointer-events-auto
                     transition-all duration-200 ease-in-out"
        >
          <button
            title="Add User"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => alert('User add handled elsewhere')}
          >
            <UserCircleIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowlrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add User
            </span>
          </button>
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
        <button
          title="Add"
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* View Details */}
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

      {/* Add Network */}
      <Modal 
        isOpen={isAddNetworkModalOpen} 
        onClose={() => setIsAddNetworkModalOpen(false)} 
        title="Add New Sahakari"
        size="2xl" 
      >
        <AddNetworkForm
          onClose={() => setIsAddNetworkModalOpen(false)}
          onNetworkAdded={handleAddSuccess}
          apiBase={API_BASE}
        />
      </Modal>

      {/* Edit Network */}
      <Modal 
        isOpen={isEditNetworkModalOpen} 
        onClose={() => setIsEditNetworkModalOpen(false)} 
        title="Edit Sahakari"
        size="2xl" 
      >
        {editingNetwork && (
          <EditNetworkForm
            initialData={editingNetwork}
            onClose={() => setIsEditNetworkModalOpen(false)}
            onNetworkUpdated={handleEditSuccess}
            apiBase={API_BASE}
          />
        )}
      </Modal>
    </>
  );
}

export default Networks;