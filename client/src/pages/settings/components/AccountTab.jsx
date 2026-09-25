import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import API from '../../../api/axios';
import { updateProfile, changePassword, logoutUser } from '../../../features/auth/authSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import {
  FiUser,
  FiMail,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiCalendar,
  FiCheck,
  FiLock,
  FiKey,
  FiAward,
  FiTrash2,
  FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../../../utils/currency';
import { formatFullDate } from '../../../utils/date';

const AccountTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Profile Form State (initialized accurately to prevent initial mount re-render)
  const [profileData, setProfileData] = useState(() => ({
    name: user?.name || '',
    monthlyIncome: user?.displayMonthlyIncome !== undefined ? user.displayMonthlyIncome : (user?.monthlyIncome ?? ''),
    fixedExpenses: user?.displayFixedExpenses !== undefined ? user.displayFixedExpenses : (user?.fixedExpenses ?? ''),
    savingsTarget: user?.displaySavingsTarget !== undefined ? user.displaySavingsTarget : (user?.savingsTarget ?? ''),
    incomeDay: user?.incomeDay ?? 1,
  }));

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const activeCurrencySymbol = getCurrencySymbol(user?.currency || 'INR');

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Danger Zone / Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Only synchronize when user object actually changes after mount
  const prevUserIdRef = React.useRef(user?._id);
  useEffect(() => {
    if (user && user._id !== prevUserIdRef.current) {
      prevUserIdRef.current = user._id;
      setProfileData({
        name: user.name || '',
        monthlyIncome: user.displayMonthlyIncome !== undefined ? user.displayMonthlyIncome : (user.monthlyIncome ?? ''),
        fixedExpenses: user.displayFixedExpenses !== undefined ? user.displayFixedExpenses : (user.fixedExpenses ?? ''),
        savingsTarget: user.displaySavingsTarget !== undefined ? user.displaySavingsTarget : (user.savingsTarget ?? ''),
        incomeDay: user.incomeDay ?? 1,
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const payload = {
      name: profileData.name.trim(),
      monthlyIncome: Number(profileData.monthlyIncome) || 0,
      fixedExpenses: Number(profileData.fixedExpenses) || 0,
      savingsTarget: Number(profileData.savingsTarget) || 0,
      incomeDay: Number(profileData.incomeDay) || 1,
      profileBaseCurrency: user?.currency || 'INR',
    };

    const result = await dispatch(updateProfile(payload));
    setIsSavingProfile(false);

    if (updateProfile.fulfilled.match(result)) {
      toast.success('Financial baseline profile saved!');
    } else {
      toast.error(result.payload || 'Failed to save profile');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    const result = await dispatch(
      changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
    );
    setIsUpdatingPassword(false);

    if (changePassword.fulfilled.match(result)) {
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      toast.error(result.payload || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm account removal');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await API.delete('/users/me');
      await dispatch(logoutUser());
      toast.success('Your account and financial data have been permanently deleted');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete account. Please try again.';
      toast.error(msg);
      setIsDeletingAccount(false);
    }
  };

  const joinDate = user?.createdAt ? formatFullDate(user.createdAt) : 'Registered Member';

  return (
    <div className="space-y-6">
      {/* Account Profile Overview Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-info-600 to-income-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-info-500/20 border border-info-400/30 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">{user?.name || 'Student Scholar'}</h3>
                  <Badge variant="success" className="gap-1">
                    <FiAward className="text-xs" /> Verified Account
                  </Badge>
                </div>
                <p className="text-xs text-dark-400 mt-0.5 truncate">{user?.email || 'student@university.edu'}</p>
                <p className="text-[11px] text-dark-500 mt-1 flex items-center gap-1">
                  <FiCalendar className="text-dark-400 shrink-0" /> Joined {joinDate}
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-750 text-xs font-medium text-dark-300 self-start sm:self-auto shrink-0">
              Currency: <span className="font-bold text-white">{user?.currency || 'INR'} ({activeCurrencySymbol})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Baseline Form */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Financial Baseline Setup</CardTitle>
            <CardDescription>
              These monthly numbers anchor your daily burn limits, safe runway estimates, and emergency margins.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                type="text"
                icon={FiUser}
                value={profileData.name}
                onChange={handleProfileChange}
                required
              />

              <Input
                label="Email Address"
                type="email"
                icon={FiMail}
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label={`Monthly Allowance / Income (${activeCurrencySymbol})`}
                name="monthlyIncome"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 10000"
                icon={FiDollarSign}
                value={profileData.monthlyIncome}
                onChange={handleProfileChange}
                helperText="Total expected pocket money, stipend, or wages"
              />

              <Input
                label={`Fixed Monthly Expenses (${activeCurrencySymbol})`}
                name="fixedExpenses"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 3000"
                icon={FiShield}
                value={profileData.fixedExpenses}
                onChange={handleProfileChange}
                helperText="Hostel fees, mess fees, room rent, subscriptions"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label={`Monthly Savings Target (${activeCurrencySymbol})`}
                name="savingsTarget"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 2000"
                icon={FiTrendingUp}
                value={profileData.savingsTarget}
                onChange={handleProfileChange}
                helperText="Target amount to save each monthly cycle"
              />

              <Input
                label="Allowance Arrival Day"
                name="incomeDay"
                type="number"
                min="1"
                max="31"
                icon={FiCalendar}
                value={profileData.incomeDay}
                onChange={handleProfileChange}
                helperText="Day of each month your funds arrive (1-31)"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSavingProfile}
                icon={FiCheck}
              >
                Save Baseline Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Security / Change Password */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Update your password to keep your financial records secure
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              icon={FiLock}
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                icon={FiKey}
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Min 6 characters"
                required
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                icon={FiKey}
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Re-type new password"
                required
              />
            </div>

            <p className="text-xs text-dark-400">
              Passwords are cryptographically hashed on the server using bcrypt before storage.
            </p>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                loading={isUpdatingPassword}
                icon={FiLock}
              >
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone / Delete Account */}
      <Card className="border-expense-500/30 bg-expense-500/[0.03]">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-expense-500/10 text-expense-400 border border-expense-500/20">
              <FiAlertTriangle className="text-lg" />
            </div>
            <div>
              <CardTitle className="text-white">Danger Zone</CardTitle>
              <CardDescription className="text-dark-400">
                Irreversible actions for your personal account and financial records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900 border border-dark-750">
            <div>
              <p className="text-sm font-semibold text-white">Delete Account & Personal Data</p>
              <p className="text-xs text-dark-400 mt-1 max-w-lg">
                Permanently purge your account, transaction logs, active budgets, and savings plans. This action cannot be reversed.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              icon={FiTrash2}
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteModalOpen(true);
              }}
              className="shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingAccount) setIsDeleteModalOpen(false);
        }}
        title="Delete Account Permanently"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-expense-500/10 border border-expense-500/20 flex items-start gap-3">
            <FiAlertTriangle className="text-expense-400 text-lg shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-white">This action is permanent and immediate.</p>
              <p className="text-dark-300">
                All your transactions, custom categories, monthly budgets, savings goals, and submitted feedback will be permanently erased from the server.
              </p>
              <p className="text-dark-300">
                You will be immediately logged out and your login credentials will cease to function.
              </p>
            </div>
          </div>

          <div>
            <label className="label mb-1 text-xs text-dark-300">
              Type <strong className="text-white font-mono uppercase">DELETE</strong> below to confirm:
            </label>
            <Input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="font-mono text-center tracking-wider"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeletingAccount}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={FiTrash2}
              loading={isDeletingAccount}
              disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
              onClick={handleDeleteAccount}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountTab;
