import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseManagedUsers, type ManagedUser } from "../../lib/users";
import { isRecord } from "../../lib/validation";
import {
  SearchIcon,
  PlusCircleIcon,
  UserCircleIcon,
} from "../../component/icons";

import Modal from "../../component/superadmin/Modal";
import AddUserForm from "../../component/admin/AddUserForm";
import EditUserForm from "../../component/admin/EditUserForm";


const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <span className="text-sm font-semibold text-gray-500 block">{label}</span>
    <span className="text-lg text-gray-800">{value ?? "-"}</span>
  </div>
);

// ⭐ Updated Component: Document Viewer Modal (Fixed for PDF viewing)
interface DocumentMetadata { hasCitizenship: boolean; citizenshipName: string; citizenshipType: string; hasPhoto: boolean; photoName: string; photoType: string; hasSignature: boolean; signatureName: string; signatureType: string }
const EMPTY_DOCUMENTS: DocumentMetadata = { hasCitizenship: false, citizenshipName: "", citizenshipType: "", hasPhoto: false, photoName: "", photoType: "", hasSignature: false, signatureName: "", signatureType: "" };
const UserDocumentsModal = ({ userId, onClose, apiBase }: { userId: string | number; onClose: () => void; apiBase: string }) => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentMetadata>(EMPTY_DOCUMENTS);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const res = await apiFetch(`${apiBase}/users/${encodeURIComponent(String(userId))}`);
        const data: unknown = await res.json();
        if (!isRecord(data)) throw new Error("Invalid document response");
        setDocuments({
          hasCitizenship: data.hasCitizenship === true, citizenshipName: typeof data.citizenshipName === "string" ? data.citizenshipName : "", citizenshipType: typeof data.citizenshipType === "string" ? data.citizenshipType : "",
          hasPhoto: data.hasPhoto === true, photoName: typeof data.photoName === "string" ? data.photoName : "", photoType: typeof data.photoType === "string" ? data.photoType : "",
          hasSignature: data.hasSignature === true, signatureName: typeof data.signatureName === "string" ? data.signatureName : "", signatureType: typeof data.signatureType === "string" ? data.signatureType : "",
        });
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, [userId, apiBase]);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">Loading documents…</div>
    );
  }

  if (loadError) {
    return <div className="py-16 text-center text-red-600">Unable to load documents.</div>;
  }

  const isPDF = (type: string, name: string) =>
    type.includes("pdf") || name.toLowerCase().endsWith(".pdf");

  const Row = ({ title, hasFile, url, name, type }: { title: string; hasFile: boolean; url: string; name: string; type: string }) => {
    if (!hasFile) return null;

    return (
      <div className="flex items-center justify-between py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{name}</p>
        </div>

        {isPDF(type, name) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:underline"
          >
            Open PDF
          </a>
        ) : (
          <img
            src={url}
            alt={title}
            className="h-20 object-contain rounded border"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Row
        title="Citizenship / NID"
        hasFile={documents.hasCitizenship}
        url={`${apiBase}/users/${encodeURIComponent(String(userId))}/citizenship`}
        name={documents.citizenshipName}
        type={documents.citizenshipType}
      />

      <Row
        title="Passport Photo"
        hasFile={documents.hasPhoto}
        url={`${apiBase}/users/${encodeURIComponent(String(userId))}/photo`}
        name={documents.photoName}
        type={documents.photoType}
      />

      <Row
        title="Signature"
        hasFile={documents.hasSignature}
        url={`${apiBase}/users/${encodeURIComponent(String(userId))}/signature`}
        name={documents.signatureName}
        type={documents.signatureType}
      />

      {!documents.hasCitizenship &&
        !documents.hasPhoto &&
        !documents.hasSignature && (
          <div className="py-12 text-center text-gray-500">
            No documents uploaded
          </div>
        )}

      <div className="flex justify-end pt-4">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const UserDetails = ({
  item,
  handleEdit,
  handleViewDocuments,
}: { item: ManagedUser; handleEdit: (user: ManagedUser) => void; handleViewDocuments: (id: string | number) => void }) => (
  <div className="space-y-8">
    {/* Header */}
    <div className="flex items-center gap-6">
      <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
        {item.hasPhoto ? (
          <img
            src={`${API_BASE}/users/${encodeURIComponent(String(item.id))}/photo`}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircleIcon className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
        <p className="text-sm text-gray-500 capitalize mt-1">{item.role}</p>
        <span
          className={`inline-block mt-2 text-sm font-medium ${
            item.status === "Active"
              ? "text-green-600"
              : item.status === "Pending"
                ? "text-yellow-600"
                : item.status === "Suspended"
                  ? "text-red-600"
                  : "text-gray-600"
          }`}
        >
          {item.status}
        </span>
      </div>
    </div>

    {/* Details */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <DetailItem label="User ID" value={item.id} />
      <DetailItem label="Email" value={item.email} />
      <DetailItem label="Phone" value={item.phone} />
      <DetailItem label="Date of Birth" value={item.dob} />
      <div className="sm:col-span-2">
        <DetailItem label="Associated Sahakari" value={item.sahakari} />
      </div>
    </div>

    {/* Actions */}
    {item.role !== "admin" && (
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={() => { handleViewDocuments(item.id); }}
          className="px-5 py-2.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
          View documents
        </button>

        <button
          onClick={() => { handleEdit(item); }}
          className="px-5 py-2.5 text-sm rounded-lg bg-green-400 text-black hover:bg-green-500 transition"
        >
          Edit
        </button>
      </div>
    )}
  </div>
);

function AdminUsers() {
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [viewModalItem, setViewModalItem] = useState<ManagedUser | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<ManagedUser | null>(null);

  // ⭐ New state for documents modal
  const [documentsModalUserId, setDocumentsModalUserId] = useState<string | number | null>(null);

  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Admin" | "Members">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();

  useEffect(() => {
    if (isRecord(location.state)) {
      if (location.state.searchQuery) {
        if (typeof location.state.searchQuery === "string") setSearchQuery(location.state.searchQuery);
      }

      if (location.state.action === "openAddUser") {
        setIsAddUserModalOpen(true);
      }

      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/session`);
        const data: unknown = await res.json();
        if (!isRecord(data) || (typeof data.sahakariId !== "string" && typeof data.sahakariId !== "number")) throw new Error("Invalid session response");
        setAuthorized(true);
      } catch {
        setAuthorized(false);
      } finally {
        setSessionLoading(false);
      }
    };

    void fetchSession();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/users`);
      setAllUsers(parseManagedUsers(await res.json()));
    } catch {
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      void loadUsers();
    }
  }, [authorized]);

  const handleRowClick = (user: ManagedUser) => {
    setViewModalItem(user);
  };

  const handleCloseViewModal = () => {
    setViewModalItem(null);
  };

  const handleEdit = (user: ManagedUser) => {
    setCurrentUserToEdit(user);
    setViewModalItem(null);
    setIsEditModalOpen(true);
  };

  // ⭐ New handler for viewing documents
  const handleViewDocuments = (userId: string | number) => {
    setDocumentsModalUserId(userId);
    setViewModalItem(null); // Close user details modal
  };

  const handleUserAddSuccess = (savedUser: ManagedUser) => {
    setAllUsers((prev) => [...prev, savedUser]);
  };

  const handleUserEditSuccess = (savedUser: ManagedUser) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === savedUser.id ? savedUser : u))
    );
  };

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((user) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Pending") return user.status === "Pending";
        if (activeFilter === "Admin") return user.role === "admin";
        return user.role === "member";
      })
      .filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          String(user.id).includes(query)
        );
      });
  }, [allUsers, activeFilter, searchQuery]);

  const getButtonClass = (filterName: "All" | "Pending" | "Admin" | "Members") => {
    return activeFilter === filterName
      ? "bg-teal-500 text-white"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  if (sessionLoading) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] flex items-center justify-center">
        <p className="text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] flex items-center justify-center">
        <p className="text-red-500">
          Unable to load sahakari. Please login again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-3 md:p-6 min-h-[calc(100vh-8.5rem)]">
        {/* Controls Section — stacks on mobile, row on desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          {/* Row 1: Search */}
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by ID, name, email, role..."
              className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-2.5 md:py-3 pl-12 pr-4 text-sm md:text-base focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
            />
          </div>

          {/* Row 2: Filter Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => { setActiveFilter("All"); }}
              className={`font-medium py-1.5 px-3 md:py-2 md:px-5 rounded-full transition-colors text-xs md:text-sm ${getButtonClass(
                "All"
              )}`}
            >
              All
            </button>
            <button
              onClick={() => { setActiveFilter("Pending"); }}
              className={`font-medium py-1.5 px-3 md:py-2 md:px-5 rounded-full transition-colors text-xs md:text-sm ${getButtonClass(
                "Pending"
              )}`}
            >
              Pending
            </button>
            <button
              onClick={() => { setActiveFilter("Admin"); }}
              className={`font-medium py-1.5 px-3 md:py-2 md:px-5 rounded-full transition-colors text-xs md:text-sm ${getButtonClass(
                "Admin"
              )}`}
            >
              Admin
            </button>
            <button
              onClick={() => { setActiveFilter("Members"); }}
              className={`font-medium py-1.5 px-3 md:py-2 md:px-5 rounded-full transition-colors text-xs md:text-sm ${getButtonClass(
                "Members"
              )}`}
            >
              Members
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-500">
              Loading users...
            </h3>
          </div>
        )}

        {!loading && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600">
                    ID
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600 hidden md:table-cell">
                    Email
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600 hidden lg:table-cell">
                    Phone
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="py-3 md:py-4 px-2 md:px-3 text-[10px] md:text-sm font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    onClick={() => { handleRowClick(user); }}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 md:py-4 px-2 md:px-3 text-gray-600 text-xs md:text-base font-medium">
                      {index + 1}
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-3 text-gray-800 text-xs md:text-base font-bold">
                      {user.name}
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-3 text-gray-700 truncate hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-3 text-gray-700 hidden lg:table-cell">{user.phone}</td>
                    <td className="py-3 md:py-4 px-2 md:px-3 text-gray-700 text-xs md:text-base capitalize">
                      {user.role}
                    </td>
                    <td className="py-3 md:py-4 px-2 md:px-3">
                      <span
                        className={`font-bold text-xs md:text-base
                        ${user.status === "Active" ? "text-green-600" : ""}
                        ${user.status === "Pending" ? "text-yellow-600" : ""}
                        ${user.status === "Suspended" ? "text-red-600" : ""}
                      `}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-500">
              No users found
            </h3>
            <p className="text-gray-400">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>

      <div className="group fixed z-20 bottom-20 right-6 md:bottom-10 md:right-10 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 opacity-0 scale-90 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-in-out">
          <button
            title="Add User"
            className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full text-teal-500 shadow-lg hover:bg-gray-100 hover:scale-105 transition-all"
            onClick={() => { setIsAddUserModalOpen(true); }}
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

      {/* User Details Modal */}
      <Modal
        isOpen={!!viewModalItem}
        onClose={handleCloseViewModal}
        title={"User Details"}
        size="3xl"
      >
        {viewModalItem && (
          <UserDetails
            item={viewModalItem}
            handleEdit={handleEdit}
            handleViewDocuments={handleViewDocuments}
          />
        )}
      </Modal>

      {/* ⭐ Documents Modal */}
      <Modal
        isOpen={!!documentsModalUserId}
        onClose={() => { setDocumentsModalUserId(null); }}
        title="User Documents"
        size="3xl"
      >
        {documentsModalUserId && (
          <UserDocumentsModal
            userId={documentsModalUserId}
            onClose={() => { setDocumentsModalUserId(null); }}
            apiBase={API_BASE}
          />
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => { setIsAddUserModalOpen(false); }}
        title="Add New User"
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
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); }}
        title="Edit User"
        size="2xl"
      >
        {currentUserToEdit && (
          <EditUserForm
            user={currentUserToEdit}
            onClose={() => { setIsEditModalOpen(false); }}
            onUserUpdated={handleUserEditSuccess}
            apiBase={API_BASE}
          />
        )}
      </Modal>

    </>
  );
}

export default AdminUsers;
