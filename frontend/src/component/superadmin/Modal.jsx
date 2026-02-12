import React from 'react';
import { CloseIcon } from '../icons';

/**
 * A reusable modal component
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when closing
 * @param {string} props.title - The title for the modal
 * @param {React.ReactNode} props.children - The content to display inside
 * @param {'xl' | '2xl' | '3xl' | '4xl'} [props.size='2xl'] - The max width of the modal
 */
function Modal({ isOpen, onClose, title, children, size = '2xl' }) {
  if (!isOpen) return null;

  const sizeMap = {
    xl: '576px',
    '2xl': '672px',
    '3xl': '768px',
    '4xl': '896px',
  };
  const maxWidth = sizeMap[size] || '672px';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl w-full overflow-y-auto relative"
        style={{ maxWidth, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex justify-between items-center pb-3 sm:pb-4 border-b">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Close"
          >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="mt-4 sm:mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;

