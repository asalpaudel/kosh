import React, { useState, useEffect } from "react";
import Modal from "../../superadmin/Modal";
import EditProfileModal from "./EditProfileModal";
import { UserCircleIcon } from "../../icons";

const API_BASE = "http://localhost:8080/api";

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

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setError("User ID not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
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
      const response = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  if (loading) return <div className="p-5 text-gray-500">Loading profile...</div>;
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;
  if (!user) return <div className="p-5 text-gray-500">No user data found.</div>;

  return (
    <>
      <div className="space-y-10">
        <div className="flex items-center gap-5 p-5 border border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
             <UserCircleIcon className="w-12 h-12 text-gray-400" />
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