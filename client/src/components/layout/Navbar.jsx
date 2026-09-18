import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiPlus, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { updateProfile } from '../../features/auth/authSlice';

const pageTitles = {
  '/': 'Financial Dashboard',
  '/transactions': 'Transactions History',
  '/transactions/add': 'Record New Transaction',
  '/budgets': 'Monthly Budgets',
  '/savings': 'Savings Goals',
  '/analytics': 'Analytics & Insights',
  '/spending-pace': 'Spending Pace Analysis',
  '/saving-plan': 'Smart Saving Planner',
  '/settings': 'Settings & Preferences',
  '/onboarding': 'Financial Setup',
};

const Navbar = ({ onOpenLogoutModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const currentTitle = pageTitles[location.pathname] || 'SmartExpense';
  const currencyCode = user?.currency || 'INR';

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 sticky top-0 z-20 flex items-center justify-between gap-4">
      {/* Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
          {currentTitle}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {location.pathname !== '/transactions/add' && (
          <Button
            variant="primary"
            size="sm"
            icon={FiPlus}
            onClick={() => navigate('/transactions/add')}
            className="hidden sm:inline-flex"
          >
            Add Transaction
          </Button>
        )}

        {/* Currency badge & quick selector */}
        <div className="relative inline-flex items-center">
          <select
            value={currencyCode}
            onChange={async (e) => {
              const newCurrency = e.target.value;
              if (newCurrency && newCurrency !== currencyCode) {
                const res = await dispatch(updateProfile({ currency: newCurrency }));
                if (updateProfile.fulfilled.match(res)) {
                  toast.success(`Display currency switched to ${newCurrency}`);
                } else {
                  toast.error(res.payload || 'Failed to switch currency');
                }
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-1 focus:ring-primary-500"
            title="Active Display Currency"
            aria-label="Active Display Currency"
          >
            {SUPPORTED_CURRENCIES.map((cur) => (
              <option key={cur.code} value={cur.code} className="bg-dark-900 text-white">
                {cur.code} ({cur.symbol})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 text-[10px] text-dark-400">▾</span>
        </div>

        {/* Quick Help & FAQ Button */}
        <button
          type="button"
          onClick={() => navigate('/settings?tab=help')}
          className="p-2 rounded-xl text-dark-400 hover:text-info-400 hover:bg-dark-800 transition-colors"
          title="Help & FAQs"
          aria-label="Help & FAQs"
        >
          <FiHelpCircle className="text-lg" />
        </button>

        {/* Mobile logout button */}
        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="lg:hidden p-2 rounded-xl text-dark-400 hover:text-expense-400 hover:bg-dark-800 transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <FiLogOut className="text-lg" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
