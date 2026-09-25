import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import {
  FiUser,
  FiSliders,
  FiTag,
  FiHelpCircle,
  FiSend,
  FiInfo,
  FiShield,
  FiLogOut
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Tab Sub-Components
import AccountTab from './components/AccountTab';
import PreferencesTab from './components/PreferencesTab';
import CategoriesTab from './components/CategoriesTab';
import HelpFaqTab from './components/HelpFaqTab';
import ContactTab from './components/ContactTab';
import AboutTab from './components/AboutTab';
import PrivacyTermsTab from './components/PrivacyTermsTab';

const TABS = [
  { id: 'account', label: 'My Account', icon: FiUser },
  { id: 'preferences', label: 'Preferences', icon: FiSliders },
  { id: 'categories', label: 'Categories', icon: FiTag },
  { id: 'help', label: 'Help & FAQ', icon: FiHelpCircle },
  { id: 'contact', label: 'Contact', icon: FiSend },
  { id: 'about', label: 'About', icon: FiInfo },
  { id: 'legal', label: 'Privacy & Terms', icon: FiShield },
];

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentTabParam = searchParams.get('tab') || 'account';
  const activeTab = TABS.some((t) => t.id === currentTabParam) ? currentTabParam : 'account';

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
              Settings & Preferences
            </h2>
            <Badge variant="info">v1.0.0</Badge>
          </div>
          <p className="text-xs sm:text-sm text-dark-400">
            Configure financial baselines, appearance, custom categories, and review privacy policies.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={FiLogOut}
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="self-start sm:self-auto shrink-0"
        >
          Sign Out
        </Button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-dark-900/80 border border-dark-800 backdrop-blur-md overflow-x-auto no-scrollbar select-none -mx-1 sm:mx-0 px-2 sm:px-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
                isActive
                  ? 'bg-info-600 text-white shadow-md shadow-info-600/30'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800/60'
              }`}
            >
              <Icon className="text-sm shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Body */}
      <div className="transition-all duration-200">
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'help' && <HelpFaqTab />}
        {activeTab === 'contact' && <ContactTab />}
        {activeTab === 'about' && <AboutTab />}
        {activeTab === 'legal' && <PrivacyTermsTab />}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to end your current session on SmartExpense?"
        confirmText="Sign Out"
        isDestructive={true}
      />
    </div>
  );
};

export default SettingsPage;
