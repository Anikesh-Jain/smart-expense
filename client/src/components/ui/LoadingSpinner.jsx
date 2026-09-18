import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  fullScreen = false,
  fullPage = false,
  message = 'Loading...',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeStyles[size] || sizeStyles.md} border-dark-700 border-t-info-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="text-xs sm:text-sm text-dark-400 font-medium">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
