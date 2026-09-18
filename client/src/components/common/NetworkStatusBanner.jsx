import React, { useState, useEffect } from 'react';
import { FiWifiOff, FiWifi } from 'react-icons/fi';

const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 max-w-md w-full transition-all duration-300 animate-in fade-in slide-in-from-top-4 pointer-events-none">
      {!isOnline ? (
        <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-expense-500/20 backdrop-blur-xl border border-expense-500/40 text-expense-200 text-xs sm:text-sm font-medium shadow-xl shadow-dark-950/60">
          <div className="flex items-center gap-2.5">
            <FiWifiOff className="text-base text-expense-400 shrink-0" />
            <span>You are currently offline. Displaying cached records.</span>
          </div>
        </div>
      ) : showRestored ? (
        <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-income-500/20 backdrop-blur-xl border border-income-500/40 text-income-200 text-xs sm:text-sm font-medium shadow-xl shadow-dark-950/60">
          <div className="flex items-center gap-2.5">
            <FiWifi className="text-base text-income-400 shrink-0" />
            <span>Connection restored. Online sync active.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NetworkStatusBanner;
