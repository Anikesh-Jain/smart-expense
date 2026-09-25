import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap shrink-0';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[40px]',
    lg: 'px-5 py-3 text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary: 'bg-info-600 text-white hover:bg-info-700 focus-visible:outline-info-500 shadow-sm shadow-info-600/20',
    secondary: 'bg-dark-700 text-dark-100 hover:bg-dark-600 border border-dark-600 focus-visible:outline-dark-400',
    success: 'bg-income-600 text-white hover:bg-income-700 focus-visible:outline-income-500 shadow-sm shadow-income-600/20',
    danger: 'bg-expense-600 text-white hover:bg-expense-700 focus-visible:outline-expense-500 shadow-sm shadow-expense-600/20',
    ghost: 'bg-transparent text-dark-300 hover:bg-dark-800 hover:text-dark-100 focus-visible:outline-dark-400',
    outline: 'bg-transparent border border-dark-600 text-dark-200 hover:bg-dark-800 hover:border-dark-500 hover:text-white focus-visible:outline-dark-400',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="text-base shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="text-base shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
