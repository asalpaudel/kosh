import type { ReactNode } from "react";
import { CloseIcon } from "../icons";

type ModalSize = "xl" | "2xl" | "3xl" | "4xl";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
}

const SIZE_WIDTH: Record<ModalSize, string> = {
  xl: "576px",
  "2xl": "672px",
  "3xl": "768px",
  "4xl": "896px",
};

export default function Modal({ isOpen, onClose, title, children, size = "2xl" }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl w-full overflow-y-auto relative"
        style={{ maxWidth: SIZE_WIDTH[size], maxHeight: "85vh" }}
        onClick={(event) => { event.stopPropagation(); }}
      >
        <div className="flex justify-between items-center pb-3 sm:pb-4 border-b">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" title="Close">
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="mt-4 sm:mt-6">{children}</div>
      </div>
    </div>
  );
}
