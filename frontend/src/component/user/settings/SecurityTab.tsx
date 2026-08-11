import { type FormEvent, useState } from "react";
import { API_BASE, ApiError, apiFetch } from "../../../lib/apiClient";

// --- Change Password Component ---
interface ChangePasswordCardProps {
  title: string;
}

type Message = { type: "" | "error" | "success"; text: string };

const ChangePasswordCard = ({ title }: ChangePasswordCardProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>({ type: "", text: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setLoading(true);

    try {
      await apiFetch(`${API_BASE}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">{title}</h3>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="space-y-4"
      >
        {message.text && (
          <div
            className={`p-3 rounded-lg text-sm ${message.type === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-600 border border-green-200"
              }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block font-semibold mb-2">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
            }}
            placeholder="Enter your current password"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
            }}
            placeholder="Enter a new password"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
            placeholder="Confirm your new password"
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Tab Component ---
function SecurityTab() {
  return (
    <div className="max-w-3xl space-y-10">

      {/* --- Change Password --- */}
      <ChangePasswordCard title="Change Password" />

    </div>
  );
}

export default SecurityTab;
