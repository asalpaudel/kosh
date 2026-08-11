import { useEffect, useState, type ReactNode } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseNetworks, type NetworkSummary } from "../../lib/networks";
import { parseManagedUsers, type ManagedUser } from "../../lib/users";

import {
  SearchIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  BuildingIcon,
  UserCircleIcon,
} from "../../component/icons";

// --- ADDED IMPORTS ---
import Modal from "../../component/superadmin/Modal";
import AddNetworkForm from "../../component/superadmin/AddNetworkForm";
import EditNetworkForm from "../../component/superadmin/EditNetworkForm";
import AddUserForm from "../../component/superadmin/AddUserForm";
import EditUserForm from "../../component/superadmin/EditUserForm";
import ConfirmationModal from "../../component/ConfirmationModal";
import { formatDualDate } from "../../lib/nepaliDate";

// --- API BASE ---

/* ----------------------------- UI Primitives ----------------------------- */

const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
    {children}
  </p>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-lg font-medium text-gray-900">{children}</h2>
);

type BadgeVariant = "default" | "blue" | "green" | "amber" | "red";
const Badge = ({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

/* ----------------------------- Detail Components ----------------------------- */

const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-sm text-gray-900">{value ?? "—"}</p>
  </div>
);

const NetworkDetails = ({ item }: { item: NetworkSummary }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
        <BuildingIcon className="w-10 h-10 text-gray-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-semibold text-gray-900 mb-1">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500">Network ID: {item.id}</p>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        <DetailItem label="Registered ID" value={item.registeredId} />
        <DetailItem label="Phone Number" value={item.phone} />
        <DetailItem label="Address" value={item.address} />
        <DetailItem label="Created At" value={formatDualDate(item.createdAt)} />
        <DetailItem label="Staff Count" value={item.staffCount} />
        <DetailItem
          label="User Count"
          value={item.userCount.toLocaleString("en-IN")}
        />
      </div>
    </div>

  </div>
);

const UserDetails = ({ item }: { item: ManagedUser }) => (
  <div className="space-y-6">
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
        <UserCircleIcon className="w-12 h-12 text-gray-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-semibold text-gray-900 mb-1">
          {item.name}
        </h3>
        <div className="flex items-center gap-3">
          <Badge variant="blue">{item.role}</Badge>
          <Badge
            variant={
              item.status === "Active"
                ? "green"
                : item.status === "Pending"
                  ? "amber"
                  : "red"
            }
          >
            {item.status}
          </Badge>
        </div>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        <DetailItem label="User ID" value={item.id} />
        <DetailItem label="Email" value={item.email} />
        <DetailItem label="Phone" value={item.phone} />
        <DetailItem label="Associated Sahakari" value={item.sahakari} />
      </div>
    </div>

  </div>
);

/* ----------------------------- Main Component ----------------------------- */

function Networks() {
  const [activeView, setActiveView] = useState<"networks" | "users">("networks");

  // Networks and Users state from backend
  const [networks, setNetworks] = useState<NetworkSummary[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // View Details modal
  const [viewModalItem, setViewModalItem] = useState<{ kind: "network"; item: NetworkSummary } | { kind: "user"; item: ManagedUser } | null>(null);

  // Add / Edit modals
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditNetworkModalOpen, setIsEditNetworkModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<NetworkSummary | null>(null);

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // Deletion confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string | number; type: "network" | "user" } | null>(null);

  // Load networks
  const loadNetworks = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/networks`);

      setNetworks(parseNetworks(await res.json()));
    } catch {
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/users/all`);

      setUsers(parseManagedUsers(await res.json()));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNetworks();
    void loadUsers();
  }, []);

  // Filtering
  const filteredNetworks = networks.filter(
    (net) =>
      net.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      net.registeredId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      net.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.sahakari.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // UI helpers
  const getButtonClass = (viewName: "networks" | "users") =>
    activeView === viewName
      ? "bg-[#21ab87] text-white shadow-sm"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  // Handlers
  const handleCloseViewModal = () => { setViewModalItem(null); };

  const handleAddSuccess = (saved: NetworkSummary) => {
    setNetworks((prev) => [...prev, saved]);
  };

  const handleUserAddSuccess = (saved: ManagedUser) => {
    setUsers((prev) => [...prev, saved]);
  };

  const openEdit = (net: NetworkSummary) => {
    setEditingNetwork(net);
    setIsEditNetworkModalOpen(true);
  };

  const openEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleUserEditSuccess = (saved: ManagedUser) => {
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
  };

  const handleEditSuccess = (saved: NetworkSummary) => {
    setNetworks((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
  };

  const deleteNetwork = (id: string) => {
    setDeleteData({ id, type: "network" });
    setIsDeleteModalOpen(true);
  };

  const deleteUser = (id: string | number) => {
    setDeleteData({ id, type: "user" });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    const { id, type } = deleteData;
    setIsDeleteModalOpen(false);
    setLoading(true);

    try {
      if (type === "network") {
        await apiFetch(`${API_BASE}/networks/${encodeURIComponent(String(id))}`, { method: "DELETE" });
        setNetworks((prev) => prev.filter((n) => n.id !== id));
      } else {
        await apiFetch(`${API_BASE}/users/${encodeURIComponent(String(id))}`, { method: "DELETE" });
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Delete failed");
    } finally {
      setLoading(false);
      setDeleteData(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="px-3 md:px-10 py-6 md:py-10 space-y-6 md:space-y-8 max-w-[1400px] mx-auto">
          {error && <p className="text-red-600" role="alert">{error}</p>}
          {/* Header */}
          <header className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
              {/* Search */}
              <div className="relative w-full sm:w-96">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => { setActiveView("networks"); }}
                  className={`font-medium py-2 px-4 rounded-md transition-colors text-sm ${getButtonClass(
                    "networks"
                  )}`}
                >
                  Networks
                </button>
                <button
                  onClick={() => { setActiveView("users"); }}
                  className={`font-medium py-2 px-4 rounded-md transition-colors text-sm ${getButtonClass(
                    "users"
                  )}`}
                >
                  Users
                </button>
              </div>
            </div>
          </header>

          <div className="border-t border-gray-200" />

          {/* NETWORKS TABLE */}
          {activeView === "networks" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Kicker>Active Networks</Kicker>
                  <SectionTitle>All Sahakari Networks</SectionTitle>
                </div>
                <p className="text-sm text-gray-500">
                  {filteredNetworks.length} network
                  {filteredNetworks.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium w-16">
                          #
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Registered ID
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Network Name
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Address
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Created
                        </th>
                        <th className="text-right px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-sm text-gray-400"
                          >
                            Loading networks…
                          </td>
                        </tr>
                      )}

                      {!loading && filteredNetworks.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-sm text-gray-400"
                          >
                            {searchQuery
                              ? "No networks match your search."
                              : "No networks found."}
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        filteredNetworks.map((network, index) => (
                          <tr
                            key={network.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {network.registeredId}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {network.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {network.address}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDualDate(network.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setViewModalItem({ kind: "network", item: network }); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                  title="View"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { openEdit(network); }}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { deleteNetwork(network.id); }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* USERS TABLE */}
          {activeView === "users" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Kicker>System Users</Kicker>
                  <SectionTitle>All Registered Users</SectionTitle>
                </div>
                <p className="text-sm text-gray-500">
                  {filteredUsers.length} user
                  {filteredUsers.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium w-16">
                          #
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Name
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Email
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Phone
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Sahakari
                        </th>
                        <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                          Role
                        </th>
                        <th className="text-right px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-sm text-gray-400"
                          >
                            Loading users…
                          </td>
                        </tr>
                      )}

                      {!loading && filteredUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-sm text-gray-400"
                          >
                            {searchQuery
                              ? "No users match your search."
                              : "No users found."}
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        filteredUsers.map((user, index) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.phone}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.sahakari}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="blue">{user.role}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setViewModalItem({ kind: "user", item: user }); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                  title="View"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { openEditUser(user); }}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { deleteUser(user.id); }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 flex flex-col items-end gap-3 z-50">
        <button
          onClick={() => { setIsAddNetworkModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#21ab87] text-white rounded-lg shadow-lg hover:bg-[#1e9e7c] active:scale-95 transition text-sm font-medium"
          title="Add Network"
        >
          <BuildingIcon className="w-4 h-4" />
          <span>Add Network</span>
        </button>
        <button
          onClick={() => { setIsAddUserModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#21ab87] text-white rounded-lg shadow-lg hover:bg-[#1e9e7c] active:scale-95 transition text-sm font-medium"
          title="Add User"
        >
          <UserCircleIcon className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* View Details */}
      <Modal
        isOpen={!!viewModalItem}
        onClose={handleCloseViewModal}
        title={viewModalItem?.kind === "network" ? "Network Details" : "User Details"}
        size="3xl"
      >
        {viewModalItem &&
          (viewModalItem.kind === "network" ? (
            <NetworkDetails item={viewModalItem.item} />
          ) : (
            <UserDetails item={viewModalItem.item} />
          ))}
      </Modal>

      {/* Add Network */}
      <Modal
        isOpen={isAddNetworkModalOpen}
        onClose={() => { setIsAddNetworkModalOpen(false); }}
        title="Add New Sahakari"
        size="2xl"
      >
        <AddNetworkForm
          onClose={() => { setIsAddNetworkModalOpen(false); }}
          onNetworkAdded={handleAddSuccess}
          apiBase={API_BASE}
        />
      </Modal>

      {/* Edit Network */}
      <Modal
        isOpen={isEditNetworkModalOpen}
        onClose={() => { setIsEditNetworkModalOpen(false); }}
        title="Edit Sahakari"
        size="2xl"
      >
        {editingNetwork && (
          <EditNetworkForm
            initialData={editingNetwork}
            onClose={() => { setIsEditNetworkModalOpen(false); }}
            onNetworkUpdated={handleEditSuccess}
            apiBase={API_BASE}
          />
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => { setIsAddUserModalOpen(false); }}
        title="Add New Admin"
        size="2xl"
      >
        <AddUserForm
          onClose={() => { setIsAddUserModalOpen(false); }}
          onUserAdded={handleUserAddSuccess}
          apiBase={API_BASE}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => { setIsEditUserModalOpen(false); }}
        title="Edit User"
        size="2xl"
      >
        {editingUser && (
          <EditUserForm
            initialData={editingUser}
            onClose={() => { setIsEditUserModalOpen(false); }}
            onUserUpdated={handleUserEditSuccess}
            apiBase={API_BASE}
          />
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteData(null);
        }}
        onConfirm={() => { void confirmDelete(); }}
        title={deleteData?.type === "network" ? "Delete Sahakari" : "Delete User"}
        message={`Are you sure you want to delete this ${deleteData?.type ?? "record"}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

export default Networks;
