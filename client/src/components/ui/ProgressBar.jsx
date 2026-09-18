import React from 'react';

const ProgressBar = ({
  value = 0,
  max = 100,
  label = '',
  showValue = false,
  color = 'emerald',
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? Math.round((value / max) * 100) : 0));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    emerald: 'bg-income-500',
    rose: 'bg-expense-500',
    amber: 'bg-warning-500',
    blue: 'bg-info-500',
    gradient: 'bg-gradient-to-r from-income-500 to-info-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-medium text-dark-300 mb-1.5">
          {label && <span>{label}</span>}
          {showValue && <span className="text-dark-200">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-dark-700/80 rounded-full overflow-hidden ${sizeStyles[size] || sizeStyles.md}`}>
        <div
          className={`${colorStyles[color] || colorStyles.emerald} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
