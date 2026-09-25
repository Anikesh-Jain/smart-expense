import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  ...props
}) => {
  return (
    <div
      className={`bg-dark-800 border border-dark-700 rounded-2xl p-4 sm:p-5 text-dark-100 ${
        hoverable ? 'hover:border-dark-600 hover:shadow-lg hover:shadow-dark-950/40 cursor-pointer transition-all duration-200' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 pb-3 border-b border-dark-700/60 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-base sm:text-lg font-semibold text-white tracking-tight break-words ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-xs sm:text-sm text-dark-400 mt-0.5 break-words ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`mt-4 pt-3 border-t border-dark-700/60 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
