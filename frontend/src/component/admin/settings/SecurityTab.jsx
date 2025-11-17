import React, { useState } from "react";

// --- Reusable Card Component ---
const SettingsCard = ({ title, children }) => (
  <div className="p-5 border border-gray-200 rounded-lg">
    <h3 className="text-xl font-semibold mb-6">{title}</h3>
    <div className="space-y-5">
      {children}
    </div>
  </div>
);

// --- Dummy 2FA Setup Component ---
const TwoFactorAuth = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggle = () => {
    if (isEnabled) {
      // Disable 2FA
      if (window.confirm("Are you sure you want to disable 2FA?")) {
        setIsEnabled(false);
        setShowSetup(false);
      }
    } else {
      // Show setup process
      setShowSetup(true);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Dummy verification
    setTimeout(() => {
      if (code.length === 6 && /^\d+$/.test(code)) {
        setIsEnabled(true);
        setShowSetup(false);
        setCode("");
        alert("2FA Enabled Successfully!");
      } else {
        setError("Invalid code. Please enter the 6-digit number.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-semibold text-gray-800">Two-Step Authentication</h4>
        <p className="text-sm text-gray-500">
          {isEnabled
            ? "Your account is protected by 2FA."
            : "Add an extra layer of security to your account."}
        </p>
      </div>
      
      {/* --- The Toggle --- */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
      </label>

      {/* --- Dummy Setup Modal (inline) --- */}
      {showSetup && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSetup(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Set up 2FA</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (e.g., Google Authenticator).
            </p>
            
            {/* 1. Dummy QR Code */}
            <div className="flex justify-center bg-gray-100 p-4 rounded-lg">
              

[Image of a QR code]

            </div>
            
            {/* 2. Dummy Secret Key */}
            <p className="text-center font-mono text-sm text-gray-700 my-4">
              ABCD 1234 EFGH 5678
            </p>

            {/* 3. Verification Form */}
            <form onSubmit={handleVerify}>
              <label className="block font-semibold mb-2">Enter 6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black text-center"
                required
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition-colors mt-6 disabled:bg-gray-300"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Tab Component ---
function SecurityTab() {
  return (
    <div className="max-w-3xl space-y-10">
      
      {/* --- Change Password --- */}
      <SettingsCard title="Change Password">
        <form className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter your current password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter a new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm your new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold"
            >
              Update Password
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* --- Two-Step Authentication --- */}
      <SettingsCard title="Account Security">
        <TwoFactorAuth />
      </SettingsCard>

    </div>
  );
}

export default SecurityTab;