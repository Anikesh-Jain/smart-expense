import React from 'react';

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    success: 'bg-income-500/15 text-income-400 border border-income-500/20',
    danger: 'bg-expense-500/15 text-expense-400 border border-expense-500/20',
    warning: 'bg-warning-500/15 text-warning-400 border border-warning-500/20',
    info: 'bg-info-500/15 text-info-400 border border-info-500/20',
    neutral: 'bg-dark-700 text-dark-300 border border-dark-600',
  };

  const dotColors = {
    success: 'bg-income-400',
    danger: 'bg-expense-400',
    warning: 'bg-warning-400',
    info: 'bg-info-400',
    neutral: 'bg-dark-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium tracking-wide whitespace-nowrap shrink-0 ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
