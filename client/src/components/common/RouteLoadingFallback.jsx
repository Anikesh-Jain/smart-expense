import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const RouteLoadingFallback = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
      <div className="p-8 rounded-3xl bg-dark-900/40 backdrop-blur-xl border border-dark-800/60 shadow-xl flex flex-col items-center text-center">
        <LoadingSpinner size="lg" className="text-info-400 mb-4" />
        <p className="text-sm font-medium text-dark-300 animate-pulse">
          Loading financial module...
        </p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
