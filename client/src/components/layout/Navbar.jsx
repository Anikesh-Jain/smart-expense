import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiPlus, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { updateProfile } from '../../features/auth/authSlice';

const pageTitles = {
  '/': { full: 'Financial Dashboard', short: 'Dashboard' },
  '/transactions': { full: 'Transactions History', short: 'Transactions' },
  '/transactions/add': { full: 'Record New Transaction', short: 'New Entry' },
  '/budgets': { full: 'Monthly Budgets', short: 'Budgets' },
  '/savings': { full: 'Savings Goals', short: 'Savings' },
  '/analytics': { full: 'Analytics & Insights', short: 'Analytics' },
  '/spending-pace': { full: 'Spending Pace Analysis', short: 'Spending Pace' },
  '/saving-plan': { full: 'Smart Saving Planner', short: 'Saving Plan' },
  '/settings': { full: 'Settings & Preferences', short: 'Settings' },
  '/onboarding': { full: 'Financial Setup', short: 'Setup' },
  '/admin': { full: 'Admin Portal', short: 'Admin' },
};

const Navbar = ({ onOpenLogoutModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const titleConfig = pageTitles[location.pathname] || { full: 'SmartExpense', short: 'SmartExpense' };
  const fullTitle = typeof titleConfig === 'string' ? titleConfig : titleConfig.full;
  const shortTitle = typeof titleConfig === 'string' ? titleConfig : titleConfig.short;
  const currencyCode = user?.currency || 'INR';

  return (
    <header className="h-16 px-3 sm:px-6 lg:px-8 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 sticky top-0 z-20 flex items-center justify-between gap-2 sm:gap-4 max-w-full overflow-hidden">
      {/* Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
          <span className="sm:hidden">{shortTitle}</span>
          <span className="hidden sm:inline">{fullTitle}</span>
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-xs font-medium text-dark-200 hover:text-white transition-colors cursor-pointer appearance-none pr-5 sm:pr-6 focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[70px] sm:max-w-none text-center sm:text-left"
            title="Active Display Currency"
            aria-label="Active Display Currency"
          >
            {SUPPORTED_CURRENCIES.map((cur) => (
              <option key={cur.code} value={cur.code} className="bg-dark-900 text-white">
                {cur.code} ({cur.symbol})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 sm:right-2 text-[10px] text-dark-400">▾</span>
        </div>

        {/* Quick Help & FAQ Button */}
        <button
          type="button"
          onClick={() => navigate('/settings?tab=help')}
          className="p-1.5 sm:p-2 rounded-xl text-dark-400 hover:text-info-400 hover:bg-dark-800 transition-colors"
          title="Help & FAQs"
          aria-label="Help & FAQs"
        >
          <FiHelpCircle className="text-base sm:text-lg" />
        </button>

        {/* Mobile logout button */}
        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-dark-400 hover:text-expense-400 hover:bg-dark-800 transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <FiLogOut className="text-base sm:text-lg" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
