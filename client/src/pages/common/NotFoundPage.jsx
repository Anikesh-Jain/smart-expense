import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { FiHome, FiCreditCard, FiCompass } from 'react-icons/fi';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-dark-900/60 backdrop-blur-xl border border-dark-700/50 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-info-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Compass icon badge */}
          <div className="w-16 h-16 rounded-2xl bg-info-500/10 border border-info-500/20 flex items-center justify-center text-info-400 mb-6 shadow-lg shadow-info-500/10">
            <FiCompass className="text-3xl animate-spin-slow" />
          </div>

          <span className="text-xs font-bold tracking-widest uppercase text-info-400 bg-info-500/10 border border-info-500/20 px-3 py-1 rounded-full mb-3">
            Error 404
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Page Not Found
          </h1>

          <p className="text-dark-400 text-sm leading-relaxed mb-8">
            The page or financial record you are looking for does not exist, has been archived, or the link is incorrect.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              variant="primary"
              icon={FiHome}
              onClick={() => navigate('/')}
              className="w-full"
            >
              Dashboard
            </Button>
            <Button
              variant="secondary"
              icon={FiCreditCard}
              onClick={() => navigate('/transactions')}
              className="w-full"
            >
              Transactions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
