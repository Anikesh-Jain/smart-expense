import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiHome,
  FiCreditCard,
  FiPieChart,
  FiTarget,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiClock,
  FiCompass,
  FiSettings,
  FiPlus,
  FiHelpCircle,
  FiShield,
  FiLogOut
} from 'react-icons/fi';

const coreNavItems = [
  { path: '/', label: 'Home', icon: FiHome },
  { path: '/transactions', label: 'History', icon: FiCreditCard },
  { path: '/budgets', label: 'Budgets', icon: FiPieChart },
  { path: '/savings', label: 'Goals', icon: FiTarget },
  { path: '/analytics', label: 'Insights', icon: FiTrendingUp },
];

const moreNavItems = [
  {
    path: '/spending-pace',
    label: 'Spending Pace & Runout',
    description: 'Daily limits & safe runway estimation',
    icon: FiClock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    path: '/saving-plan',
    label: 'Smart Saving Plan',
    description: 'Goal feasibility & category reductions',
    icon: FiCompass,
    color: 'text-info-400',
    bg: 'bg-info-400/10',
  },
  {
    path: '/transactions/add',
    label: 'Add Transaction',
    description: 'Record an income or expense',
    icon: FiPlus,
    color: 'text-income-400',
    bg: 'bg-income-400/10',
  },
  {
    path: '/settings',
    label: 'Settings & Baseline',
    description: 'Financial baseline & appearance',
    icon: FiSettings,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    path: '/settings?tab=help',
    label: 'Help & FAQs',
    description: 'Calculation guides & student advice',
    icon: FiHelpCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    path: '/settings?tab=legal',
    label: 'Privacy & Terms',
    description: 'Student data security & disclaimers',
    icon: FiShield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
];

const MobileNav = ({ onOpenLogoutModal }) => {
  const { user } = useSelector((state) => state.auth);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isMoreActive = moreNavItems.some((item) => item.path === location.pathname) || (user?.role === 'admin' && location.pathname === '/admin');

  const handleNavigate = (path) => {
    setIsMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile Slide-up "More" Sheet */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Body */}
          <div className="absolute bottom-0 inset-x-0 bg-dark-900 border-t border-dark-750 rounded-t-3xl p-5 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-dark-800">
              <span className="text-sm font-bold text-white tracking-tight">Navigation & Utilities</span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/admin')}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-purple-600 text-white border border-purple-500 shadow-sm shadow-purple-600/30'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                    <FiShield className="text-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">Admin Portal</div>
                    <div className="text-xs text-purple-400/80 truncate">System stats, users, feedback</div>
                  </div>
                </button>
              )}
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isSelected = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-dark-800/90 border border-dark-700'
                        : 'bg-dark-950/40 hover:bg-dark-800/60 border border-dark-800/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
                      <Icon className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{item.label}</div>
                      <div className="text-xs text-dark-400 truncate">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sign Out Option */}
            {onOpenLogoutModal && (
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenLogoutModal();
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-expense-500/10 hover:bg-expense-500/20 border border-expense-500/20 text-left transition-all text-expense-400"
              >
                <div className="w-10 h-10 rounded-xl bg-expense-500/15 flex items-center justify-center text-expense-400 shrink-0">
                  <FiLogOut className="text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-expense-300">Sign Out</div>
                  <div className="text-xs text-expense-400/80">Log out of this device securely</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800/80 px-1 py-1.5 flex items-center justify-around select-none">
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-info-400 font-semibold'
                    : 'text-dark-400 hover:text-dark-200'
                }`
              }
            >
              <Icon className="text-lg mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
            isMoreActive || isMoreOpen
              ? 'text-info-400 font-semibold'
              : 'text-dark-400 hover:text-dark-200'
          }`}
          aria-label="More navigation items"
        >
          <FiMenu className="text-lg mb-0.5" />
          <span>More</span>
          {isMoreActive && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-info-400" />
          )}
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
