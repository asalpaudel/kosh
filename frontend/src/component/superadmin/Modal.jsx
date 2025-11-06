import React from 'react';
import { CloseIcon } from '../icons';

/**
 * A reusable modal component
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when closing
 * @param {string} props.title - The title for the modal
 * @param {React.ReactNode} props.children - The content to display inside
 * @param {'2xl' | '3xl'} [props.size='2xl'] - The max width of the modal
 */
function Modal({ isOpen, onClose, title, children, size = '2xl' }) {
  if (!isOpen) return null;

  // This logic is added from your Networks.jsx
  const sizeClass = size === '3xl' ? 'max-w-3xl' : 'max-w-2xl';

  return (
    <div
      // The overlay: covers the whole screen, blurs background
      className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-[3px] p-4"
      onClick={onClose} // Click outside the box to close
    >
      <div
        // The modal "box": white background, rounded, shadow
        // The sizeClass variable is now used here
        className={`bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full ${sizeClass} relative`}
        onClick={(e) => e.stopPropagation()} // Prevents closing modal when clicking *inside* the box
      >
        {/* Header with Title and Close Button */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-2xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;