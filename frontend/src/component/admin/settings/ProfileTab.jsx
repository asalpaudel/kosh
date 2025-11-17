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
  const [user, setUser] = useState(null); // Initialize user as null
  const [loading, setLoading] = useState(true); // Add a loading state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState(""); // State for API errors

  // --- NEW: Fetch real user data ---
  useEffect(() => {
    // Get the admin's user ID from localStorage
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setApiError("Could not find user ID. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`); // Use the backend endpoint
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // Empty dependency array means this runs once on mount

  // --- MODIFIED: Handle the update with a PUT request ---
  const handleUpdate = async (updatedUserData) => {
    setApiError(""); // Clear old errors
    try {
      // Send the updated data to the backend
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData), // Send the complete updated object
      });

      if (!response.ok) {
        throw new Error("Failed to update profile.");
      }

      const savedUser = await response.json();
      
      setUser(savedUser); // Update the local state with the saved user
      setIsModalOpen(false);
      alert("Profile Updated Successfully!");

    } catch (err) {
      setApiError(err.message);
      alert(`Error updating profile: ${err.message}`);
    }
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return <div className="p-5">Loading profile...</div>;
  }

  if (apiError) {
    return <div className="p-5 text-red-500">Error: {apiError}</div>;
  }
  
  // Don't render if user data hasn't loaded
  if (!user) {
    return <div className="p-5">No user data found.</div>;
  }

  return (
    <>
      <div className="space-y-10">
        {/* --- Profile Header --- */}
        <div className="flex items-center gap-5 p-5 border border-gray-200 rounded-lg">
          <UserCircleIcon className="w-16 h-16 text-gray-400 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">
              {user.sahakari} -{" "}
              <span className={`font-semibold ${
                user.status === "Active" ? "text-green-600" : "text-yellow-600"
              }`}>
                {user.status}
              </span>
            </p>
          </div>
        </div>

        {/* --- Personal Information Card --- */}
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
            {/* These fields exist in User.java and will show data */}
            <InfoItem label="Full Name" value={user.name} />
            <InfoItem label="Email Address" value={user.email} />
            <InfoItem label="Phone Number" value={user.phone} />
          </div>
        </div>

        {/* --- Address & Contact Card (Your "KYC" fields) --- */}
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
            {/* These fields are NOT in User.java, so they will show "-" */}
            <InfoItem label="Primary Address" value={user.address} />
            <InfoItem label="Secondary Address" value={user.secondaryAddress} />
            <InfoItem label="Secondary Contact Info" value={user.secondaryContact} />
          </div>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {/* This modal now gets real data and a real save function */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Profile"
        size="2xl"
      >
        <EditProfileModal
          currentUserData={user}
          onSave={handleUpdate} // Pass the new handleUpdate function
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}

export default ProfileTab;