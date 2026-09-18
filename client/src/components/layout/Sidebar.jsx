import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import {
  FiHome,
  FiCreditCard,
  FiPieChart,
  FiTarget,
  FiTrendingUp,
  FiClock,
  FiZap,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiUser,
  FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/transactions', label: 'Transactions', icon: FiCreditCard },
  { path: '/budgets', label: 'Budgets', icon: FiPieChart },
  { path: '/savings', label: 'Savings Goals', icon: FiTarget },
  { path: '/analytics', label: 'Analytics', icon: FiTrendingUp },
  { path: '/spending-pace', label: 'Spending Pace', icon: FiClock },
  { path: '/saving-plan', label: 'Saving Plan', icon: FiZap },
  { path: '/settings', label: 'Settings', icon: FiSettings },
  { path: '/settings?tab=help', label: 'Help & FAQ', icon: FiHelpCircle },
];

const Sidebar = ({ onOpenLogoutModal }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    if (onOpenLogoutModal) {
      onOpenLogoutModal();
      return;
    }
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-800 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-info-600 to-income-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-info-600/20">
            ₹
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">SmartExpense</span>
            <span className="block text-[10px] text-dark-400 font-medium uppercase tracking-wider">Student Edition</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-dark-400 px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700">
          v1.0.0
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-dark-400">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-info-600 text-white shadow-sm shadow-info-600/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                }`
              }
            >
              <Icon className="text-lg shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <div className="pt-3 mt-2 border-t border-dark-800/80">
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <FiShield className="text-xs" /> Administration
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/20'
                }`
              }
            >
              <FiShield className="text-lg shrink-0" />
              <span>Admin Portal</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* User Profile & Logout Bottom Section */}
      <div className="p-3 border-t border-dark-800">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-850 border border-dark-700/50">
          <button
            type="button"
            onClick={() => navigate('/settings?tab=account')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity"
            title="Open Account Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-dark-200 shrink-0 font-semibold text-xs border border-dark-600">
              {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Student'}
              </p>
              <p className="text-[11px] text-dark-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-dark-400 hover:text-expense-400 hover:bg-dark-700/50 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <FiLogOut className="text-base" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
