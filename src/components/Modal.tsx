import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="relative bg-gradient-to-br from-feud-dark via-feud-blue to-feud-dark rounded-3xl p-8 max-w-4xl w-full mx-4 border-4 border-feud-gold shadow-2xl animate-bounce-in max-h-[90vh] overflow-y-auto">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

