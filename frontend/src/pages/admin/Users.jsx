import React, { useState, useMemo, useEffect } from "react";
import {
  SearchIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  UserCircleIcon,
  DocumentIcon,
  CheckIcon,
  XIcon,
  UserPlusIcon,
} from "../../component/icons.jsx";

import Modal from "../../component/superadmin/Modal.jsx";
import AddUserForm from "../../component/admin/AddUserForm.jsx";
import AddStaffForm from "../../component/admin/AddStaffForm.jsx";
import EditUserForm from "../../component/admin/EditUserForm.jsx";

const API_BASE = "http://localhost:8080/api";

const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-sm font-semibold text-gray-500 block">{label}</span>
    <span className="text-lg text-gray-800">{value ?? "-"}</span>
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

const UserDetails = ({
  item,
  onCloseViewModal,
  handleApprove,
  handleDeny,
  handleEdit,
}) => (
  <div className="flex flex-col">
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
      <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
        <UserCircleIcon className="w-28 h-28 text-gray-400" />
      </div>
      <div className="flex-1 space-y-5">
        <div>
          <h3 className="text-3xl font-bold">{item.name}</h3>
          <span className="text-lg text-teal-600 font-semibold capitalize block">
            {item.role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <DetailItem label="User ID" value={item.id} />
          <div>
            <span className="text-sm font-semibold text-gray-500 block">
              Status
            </span>
            <span
              className={`text-lg font-bold
              ${item.status === "Active" ? "text-green-600" : ""}
              ${item.status === "Pending" ? "text-yellow-600" : ""}
              ${item.status === "Suspended" ? "text-red-600" : ""}
            `}
            >
              {item.status ?? "Active"}
            </span>
          </div>
          <DetailItem label="Email" value={item.email} />
          <DetailItem label="Phone" value={item.phone} />
          <div className="col-span-2">
            <DetailItem label="Associated Sahakari" value={item.sahakari} />
          </div>
        </div>
        
        {!!item.documents?.length && (
          <div>
            <span className="text-sm font-semibold text-gray-500 block mb-2">
              Uploaded Documents
            </span>
            <div className="flex flex-col gap-1.5">
              {item.documents.map((doc, index) => (
                <DocumentLink key={index} doc={doc} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>


  </div>
);

function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [adminSahakari, setAdminSahakari] = useState(null);

  const [viewModalItem, setViewModalItem] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ⭐ Fetch admin's sahakari from session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log("Fetching session...");
        const res = await fetch(`${API_BASE}/session`, {
          method: "GET",
          credentials: "include",
        });

        console.log("Session response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Session data:", data);

          if (!data.sahakariId) {
            console.error("No sahakariId in session data");
            setSessionLoading(false);
            return;
          }

          // Clean the sahakariId - remove any non-numeric characters
          let cleanId = String(data.sahakariId).replace(/[^0-9]/g, '');
          console.log("Original sahakariId:", data.sahakariId, "Cleaned:", cleanId);

          // Get the network name from networkId
          console.log("Fetching network with ID:", cleanId);
          const networkRes = await fetch(`${API_BASE}/networks/${cleanId}`, {
            credentials: "include",
          });
          
          console.log("Network response status:", networkRes.status);

          if (networkRes.ok) {
            const networkData = await networkRes.json();
            console.log("Network data:", networkData);

            if (networkData && networkData.name) {
              setAdminSahakari(networkData.name);
              console.log("✅ Admin's Sahakari set to:", networkData.name);
            } else {
              console.error("Network data is null or has no name");
            }
          } else {
            console.error("Failed to fetch network, status:", networkRes.status);
          }
        } else {
          console.error("Failed to fetch session, status:", res.status);
        }
      } catch (e) {
        console.error("Error fetching session:", e);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, []);

  // ⭐ Load only users from admin's sahakari
  const loadUsers = async () => {
    if (!adminSahakari) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        // ⭐ Filter users by admin's sahakari
        const filteredBySahakari = data.filter(
          (user) => user.sahakari === adminSahakari
        );
        setAllUsers(filteredBySahakari);
        console.log(`Loaded ${filteredBySahakari.length} users from ${adminSahakari}`);
      } else {
        console.error("API did not return an array:", data);
        setAllUsers([]);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load users when adminSahakari is available
  useEffect(() => {
    if (adminSahakari) {
      loadUsers();
    }
  }, [adminSahakari]);

  const handleViewClick = (item) => setViewModalItem(item);
  const handleCloseViewModal = () => setViewModalItem(null);

  const handleApprove = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/approve`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        console.log(`User ${userId} approved`);
        alert("User approved successfully!");
        await loadUsers();
      } else {
        alert("Failed to approve user");
      }
    } catch (e) {
      console.error("Error approving user:", e);
      alert("Error approving user");
    }
  };

  const handleDeny = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/reject`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        console.log(`User ${userId} rejected`);
        alert("User rejected successfully!");
        await loadUsers();
      } else {
        alert("Failed to reject user");
      }
    } catch (e) {
      console.error("Error rejecting user:", e);
      alert("Error rejecting user");
    }
  };

  const handleEdit = (user) => {
    console.log(`Editing user ${user.id}`);
    setCurrentUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete user");
    }
  };

  const handleUserAddSuccess = (savedUser) => {
    setAllUsers((prev) => [...prev, savedUser]);
  };

  const handleStaffAddSuccess = (savedStaff) => {
    setAllUsers((prev) => [...prev, savedStaff]);
  };

  const handleUserEditSuccess = (savedUser) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === savedUser.id ? savedUser : u))
    );
  };

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((user) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Pending") return user.status === "Pending";
        if (activeFilter === "Staff") return user.role === "staff";
        if (activeFilter === "Members") return user.role === "member";
        return true;
      })
      .filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.role?.toLowerCase().includes(query) ||
          String(user.id).includes(query)
        );
      });
  }, [allUsers, activeFilter, searchQuery]);

  const getButtonClass = (filterName) => {
    return activeFilter === filterName
      ? "bg-black text-white"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  // Show loading while fetching session
  if (sessionLoading) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] flex items-center justify-center">
        <p className="text-gray-500">Loading session...</p>
      </div>
    );
  }

  // Show error if no sahakari found
  if (!adminSahakari) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] flex items-center justify-center">
        <p className="text-red-500">Unable to load sahakari. Please login again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)]">
        {/* Search and Filter Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by ID, name, email, role..."
              className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-12 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFilter("All")}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass("All")}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("Pending")}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass("Pending")}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter("Staff")}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass("Staff")}`}
            >
              Staff
            </button>
            <button
              onClick={() => setActiveFilter("Members")}
              className={`font-medium py-3 px-6 rounded-full transition-colors text-base ${getButtonClass("Members")}`}
            >
              Members
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-500">
              Loading users...
            </h3>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">Phone</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="py-4 px-3 text-sm font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-3 text-gray-600 font-medium">{index + 1}</td>
                    <td className="py-4 px-3 text-gray-800 font-bold">{user.name}</td>
                    <td className="py-4 px-3 text-gray-700 truncate">{user.email}</td>
                    <td className="py-4 px-3 text-gray-700">{user.phone}</td>
                    <td className="py-4 px-3 text-gray-700 capitalize">{user.role}</td>
                    <td className="py-4 px-3">
                      <span
                        className={`font-bold
                        ${user.status === "Active" ? "text-green-600" : ""}
                        ${user.status === "Pending" ? "text-yellow-600" : ""}
                        ${user.status === "Suspended" ? "text-red-600" : ""}
                      `}
                      >
                        {user.status ?? "Active"}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      {user.status === "Pending" ? (
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleViewClick(user)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-yellow-500 hover:text-yellow-700"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleViewClick(user)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-yellow-500 hover:text-yellow-700"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-500">No users found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 opacity-0 scale-90 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-in-out">
          <button
            title="Add Staff"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => setIsAddStaffModalOpen(true)}
          >
            <UserPlusIcon className="w-7 h-7" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 pointer-events-none">
              Add Staff
            </span>
          </button>

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
        isOpen={!!viewModalItem}
        onClose={handleCloseViewModal}
        title={"User Details"}
        size="3xl"
      >
        {viewModalItem && (
          <UserDetails
            item={viewModalItem}
            onCloseViewModal={handleCloseViewModal}
            handleApprove={handleApprove}
            handleDeny={handleDeny}
            handleEdit={handleEdit}
          />
        )}
      </Modal>

      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
        size="2xl"
      >
        <AddUserForm
          onClose={() => setIsAddUserModalOpen(false)}
          onUserAdded={handleUserAddSuccess}
          apiBase={API_BASE}
        />
      </Modal>

      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        title="Add New Staff"
        size="2xl"
      >
        <AddStaffForm
          onClose={() => setIsAddStaffModalOpen(false)}
          onStaffAdded={handleStaffAddSuccess}
          apiBase={API_BASE}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        size="2xl"
      >
        {currentUserToEdit && (
          <EditUserForm
            user={currentUserToEdit}
            onClose={() => setIsEditModalOpen(false)}
            onUserUpdated={handleUserEditSuccess}
            apiBase={API_BASE}
          />
        )}
      </Modal>
    </>
  );
}

export default AdminUsers;