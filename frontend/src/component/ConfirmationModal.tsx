import Modal from "./superadmin/Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info";
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen, onClose, onConfirm, title, message, confirmText = "Confirm",
  cancelText = "Cancel", type = "info", loading = false,
}: ConfirmationModalProps) {
  const isDanger = type === "danger";
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
      <div className="flex flex-col gap-6">
        <div className={`p-4 rounded-xl ${isDanger ? "bg-red-50 border-l-4 border-red-500" : "bg-teal-50 border-l-4 border-teal-500"}`}>
          <p className={`text-sm ${isDanger ? "text-red-700" : "text-teal-700"}`}>{message}</p>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors" disabled={loading}>{cancelText}</button>
          <button type="button" onClick={onConfirm} className={`px-6 py-2.5 rounded-full font-semibold text-white transition-colors shadow-lg ${isDanger ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-teal-500 hover:bg-teal-600 shadow-teal-200"}`} disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
