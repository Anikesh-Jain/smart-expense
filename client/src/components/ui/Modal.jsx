import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className = '',
}) => {
  // Handle Esc key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`w-full ${sizeStyles[size] || sizeStyles.md} transform overflow-hidden rounded-2xl bg-dark-850 border border-dark-700 p-4 sm:p-6 text-left align-middle shadow-2xl transition-all animate-scale-in ${className}`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight break-words">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-dark-400 mt-1 break-words">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition-colors"
                  aria-label="Close modal"
                >
                  <FiX className="text-lg" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
