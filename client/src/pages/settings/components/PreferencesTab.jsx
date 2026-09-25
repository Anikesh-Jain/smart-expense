import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../../features/auth/authSlice';
import { useTheme } from '../../../context/useTheme';
import { THEME_MODES } from '../../../context/themeConstants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import {
  FiMoon,
  FiSun,
  FiMonitor,
  FiDollarSign,
  FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { SUPPORTED_CURRENCIES, formatCurrency } from '../../../utils/currency';

const PreferencesTab = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, changeTheme } = useTheme();

  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [prevCurrency, setPrevCurrency] = useState(user?.currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  // Sync state with store updates without cascading effect renders (official React pattern)
  if (user?.currency && user.currency !== prevCurrency) {
    setPrevCurrency(user.currency);
    setSelectedCurrency(user.currency);
  }

  // Student Smart Notification Toggles (persisted locally)
  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem('smart_expense_alerts');
      return stored
        ? JSON.parse(stored)
        : {
            safeSpendAlert: true,
            weekendSurgeNotice: true,
            monthlyBudgetWarning: true,
          };
    } catch {
      return {
        safeSpendAlert: true,
        weekendSurgeNotice: true,
        monthlyBudgetWarning: true,
      };
    }
  });

  const handleToggleAlert = (key) => {
    setAlerts((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('smart_expense_alerts', JSON.stringify(updated));
      } catch {
        // Ignore localStorage error
      }
      toast.success('Alert preferences updated');
      return updated;
    });
  };

  const handleCurrencySave = async (e) => {
    e.preventDefault();
    if (selectedCurrency === user?.currency) {
      toast('Currency is already set to ' + selectedCurrency, { icon: 'ℹ️' });
      return;
    }

    setIsSavingCurrency(true);
    const result = await dispatch(updateProfile({ currency: selectedCurrency }));
    setIsSavingCurrency(false);

    if (updateProfile.fulfilled.match(result)) {
      toast.success(`Active currency switched to ${selectedCurrency}!`);
    } else {
      toast.error(result.payload || 'Failed to update currency');
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Appearance & Theme</CardTitle>
            <CardDescription>
              Choose how SmartExpense looks on your device. Dark mode is the flagship obsidian glassmorphism.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => changeTheme(THEME_MODES.DARK)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                theme === THEME_MODES.DARK
                  ? 'bg-dark-900 border-info-500/80 shadow-lg shadow-info-500/10 ring-1 ring-info-500'
                  : 'bg-dark-900/60 border-dark-750 hover:border-dark-600 hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-info-500/15 border border-info-500/30 flex items-center justify-center text-info-400">
                  <FiMoon className="text-base" />
                </div>
                {theme === THEME_MODES.DARK && (
                  <Badge variant="info">Active</Badge>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Obsidian Dark</h4>
              <p className="text-xs text-dark-400 mt-1">
                Flagship dark glassmorphism tailored for late-night study sessions.
              </p>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => changeTheme(THEME_MODES.LIGHT)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                theme === THEME_MODES.LIGHT
                  ? 'bg-dark-900 border-info-500/80 shadow-lg shadow-info-500/10 ring-1 ring-info-500'
                  : 'bg-dark-900/60 border-dark-750 hover:border-dark-600 hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-warning-500/15 border border-warning-500/30 flex items-center justify-center text-warning-400">
                  <FiSun className="text-base" />
                </div>
                {theme === THEME_MODES.LIGHT && (
                  <Badge variant="warning">Active</Badge>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Frosted Daylight</h4>
              <p className="text-xs text-dark-400 mt-1">
                Crisp high-contrast daylight styling for bright library and campus environments.
              </p>
            </button>

            {/* System Mode Option */}
            <button
              type="button"
              onClick={() => changeTheme(THEME_MODES.SYSTEM)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                theme === THEME_MODES.SYSTEM
                  ? 'bg-dark-900 border-info-500/80 shadow-lg shadow-info-500/10 ring-1 ring-info-500'
                  : 'bg-dark-900/60 border-dark-750 hover:border-dark-600 hover:bg-dark-850'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-income-500/15 border border-income-500/30 flex items-center justify-center text-income-400">
                  <FiMonitor className="text-base" />
                </div>
                {theme === THEME_MODES.SYSTEM && (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">Sync with System</h4>
              <p className="text-xs text-dark-400 mt-1">
                Dynamically matches your OS device preference automatically.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Currency Selector Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Display Currency Configuration</CardTitle>
            <CardDescription>
              Select your active display currency for dashboard balances, analytics, and spending limits.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCurrencySave} className="space-y-4 max-w-xl">
            {/* Currency Explanation Callout */}
            <div className="p-3.5 rounded-xl bg-info-500/10 border border-info-500/20 text-xs text-info-300 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span>ℹ️</span> Presentation Only
              </p>
              <p className="text-dark-300">
                Your selected display currency changes presentation only. All transaction records, historical budgets, and savings contributions are permanently preserved in their original currencies without mutation.
              </p>
            </div>

            <Select
              label="Active Display Currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              icon={FiDollarSign}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </Select>

            {/* Live Sample Formatting Preview */}
            <div className="p-3 rounded-xl bg-dark-900/80 border border-dark-750 flex items-center justify-between">
              <span className="text-xs text-dark-400">Sample Live Format Preview:</span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(12450.75, selectedCurrency, true)}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSavingCurrency}
                icon={FiCheck}
                disabled={selectedCurrency === user?.currency}
              >
                Apply Display Currency
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Student Alert Preferences Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Student Alert & Guardrail Preferences</CardTitle>
            <CardDescription>
              Customize in-app warnings and financial discipline guardrails.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-750">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">Daily Safe Limit Exceeded Notice</p>
              <p className="text-xs text-dark-400">
                Display caution badges when spending exceeds the daily safe burn rate threshold.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAlert('safeSpendAlert')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                alerts.safeSpendAlert ? 'bg-info-600' : 'bg-dark-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  alerts.safeSpendAlert ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-750">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">Weekend Burn Rate Surge Caution</p>
              <p className="text-xs text-dark-400">
                Flag excessive non-essential expenditures incurred over weekend outings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAlert('weekendSurgeNotice')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                alerts.weekendSurgeNotice ? 'bg-info-600' : 'bg-dark-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  alerts.weekendSurgeNotice ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-dark-750">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">Monthly Budget Threshold Warnings</p>
              <p className="text-xs text-dark-400">
                Alert when category spending crosses 80% and 100% of allocated limit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAlert('monthlyBudgetWarning')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                alerts.monthlyBudgetWarning ? 'bg-info-600' : 'bg-dark-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  alerts.monthlyBudgetWarning ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreferencesTab;
