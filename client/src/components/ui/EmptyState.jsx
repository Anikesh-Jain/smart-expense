import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No records found',
  description = 'There are no items to display right now.',
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-dark-900/50 border border-dashed border-dark-700 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center text-dark-400 mb-4 border border-dark-700/60 shadow-inner">
        <Icon className="text-2xl" />
      </div>
      <h4 className="text-base sm:text-lg font-semibold text-white mb-1 tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-dark-400 max-w-sm mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
