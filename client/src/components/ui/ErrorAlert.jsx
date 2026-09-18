import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import Button from './Button';

const ErrorAlert = ({
  message = 'An unexpected error occurred.',
  title = 'Something went wrong',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-2xl bg-expense-500/10 border border-expense-500/20 text-expense-200 flex items-start gap-3 ${className}`}>
      <FiAlertCircle className="text-xl text-expense-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-semibold text-expense-300 mb-0.5">
          {title}
        </h5>
        <p className="text-xs sm:text-sm text-expense-300/80">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          icon={FiRefreshCw}
          className="shrink-0 text-xs py-1 px-2.5"
        >
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorAlert;
