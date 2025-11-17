import React, { useState } from "react";
import Modal from "../../superadmin/Modal"; // Reusing the modal
import EditProfileModal from "./EditProfileModal"; // We will create this
import { UserCircleIcon } from "../../icons";

// A reusable component for displaying info fields
const InfoItem = ({ label, value }) => (
  <div className="flex-1 min-w-[250px]">
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <p className="mt-1 text-base text-gray-900">{value || "-"}</p>
  </div>
);

// Mock user data - in a real app, this would come from an API
const getMockUser = () => ({
  id: "123",
  name: "Barsey geda",
  email: "123@gmail.com",
  phone: "+09345348 46",
  address: "lamo",
  secondaryAddress: "",
  secondaryContact: "Jane Doe (Spouse) +0911122233",
  sahakari: "Geda Sahakari",
  status: "Active",
});

function ProfileTab() {
  const [user, setUser] = useState(getMockUser());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser);
    setIsModalOpen(false);
    // Here you would also make an API call to save the data
    alert("Profile Updated Successfully!");
  };

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
              <span className="font-semibold text-green-600">{user.status}</span>
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
            <InfoItem label="Primary Address" value={user.address} />
            <InfoItem label="Secondary Address" value={user.secondaryAddress} />
            <InfoItem label="Secondary Contact Info" value={user.secondaryContact} />
          </div>
        </div>
      </div>

      {/* --- Edit Modal --- */}
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