import React from 'react';
import Modal from './superadmin/Modal';

/**
 * A reusable confirmation modal for critical actions.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when closing/cancelling
 * @param {function} props.onConfirm - Function to call when confirming
 * @param {string} props.title - The title for the modal
 * @param {string} props.message - The confirmation message
 * @param {string} [props.confirmText='Confirm'] - Text for the confirm button
 * @param {string} [props.cancelText='Cancel'] - Text for the cancel button
 * @param {'danger' | 'info'} [props.type='info'] - The style of the modal
 * @param {boolean} [props.loading=false] - Whether the confirm action is loading
 */
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    loading = false
}) {
    const isDanger = type === 'danger';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl">
            <div className="flex flex-col gap-6">
                <div className={`p-4 rounded-xl ${isDanger ? 'bg-red-50 border-l-4 border-red-500' : 'bg-teal-50 border-l-4 border-teal-500'}`}>
                    <p className={`text-sm ${isDanger ? 'text-red-700' : 'text-teal-700'}`}>
                        {message}
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2.5 rounded-full font-semibold text-white transition-colors shadow-lg ${isDanger
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                : 'bg-teal-500 hover:bg-teal-600 shadow-teal-200'
                            }`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmationModal;
