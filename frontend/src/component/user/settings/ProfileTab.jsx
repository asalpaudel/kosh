import { API_BASE } from "../../../lib/apiClient";
import React, { useState, useEffect } from "react";
import Modal from "../../superadmin/Modal";
import EditProfileModal from "./EditProfileModal";
import { UserCircleIcon } from "../../icons";


const InfoItem = ({ label, value }) => (
  <div className="flex-1 min-w-[250px]">
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <p className="mt-1 text-base text-gray-900">{value || "-"}</p>
  </div>
);

function ProfileTab() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          credentials: "include", 
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async (updatedData) => {
    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update profile");
      }

      const savedUser = await response.json();
      setUser(savedUser); 
      setIsModalOpen(false);
      alert("Profile Updated Successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert(`Error updating profile: ${err.message}`);
      throw err; 
    }
  };

  // Get the photo URL for the user
  const getPhotoUrl = () => {
    if (!user || !user.hasPhoto) return null;
    return `${API_BASE}/users/me/photo`;
  };

  const photoUrl = getPhotoUrl();

  if (loading) return <div className="p-5 text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;
  if (!user) return <div className="p-5 text-gray-500">No user data found.</div>;

  return (
    <>
      <div className="space-y-10">
        <div className="flex items-center gap-5 p-5 border border-gray-200 rounded-lg">
          {/* User Photo or Default Icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 ring-2 ring-gray-200">
            {photoUrl && !photoError ? (
              <img
                src={photoUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <UserCircleIcon className="w-16 h-16 text-gray-400" />
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">
              {user.sahakari || "No Sahakari"} -{" "}
              <span className={`font-semibold ${user.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.status || "Pending"}
              </span>
            </p>
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-semibold text-teal-600 hover:text-teal-800"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-5">
            <InfoItem label="Full Name" value={user.name} />
            <InfoItem label="Email Address" value={user.email} />
            <InfoItem label="Phone Number" value={user.phone} />
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Address & Secondary Contact</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-semibold text-teal-600 hover:text-teal-800"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-5">
            <InfoItem label="Primary Address" value={user.address} />
            <InfoItem label="Secondary Address" value={user.secondaryAddress} />
            <InfoItem label="Secondary Contact Info" value={user.secondaryContact} />
          </div>
        </div>

        {/* Documents Section */}
        {(user.hasPhoto || user.hasCitizenship || user.hasSignature) && (
          <div className="p-5 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-6">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.hasPhoto && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Profile Photo</p>
                  <a
                    href={`${API_BASE}/users/me/photo`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 text-sm font-semibold"
                  >
                    View Photo
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{user.photoName}</p>
                </div>
              )}
              
              {user.hasCitizenship && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Citizenship Document</p>
                  <a
                    href={`${API_BASE}/users/me/citizenship`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 text-sm font-semibold"
                  >
                    View Document
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{user.citizenshipName}</p>
                </div>
              )}
              
              {user.hasSignature && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Signature</p>
                  <a
                    href={`${API_BASE}/users/me/signature`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 text-sm font-semibold"
                  >
                    View Signature
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{user.signatureName}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Profile"
        size="2xl"
      >
        <EditProfileModal
          currentUserData={user}
          onSave={handleUpdate}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}

export default ProfileTab;
