import React, { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiLock, FiCheckCircle, FiKey, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') || '';
  const initialToken = routeToken || queryToken || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!token.trim()) {
      errs.token = 'Reset token is required';
    }
    if (!password) {
      errs.password = 'New password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your new password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanToken = token.trim();
      const res = await API.post(`/auth/reset-password/${cleanToken}`, {
        password
      });

      setIsSuccess(true);
      toast.success(res.data?.message || 'Password reset successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 text-center">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-info-600 to-income-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-info-600/30">
          ₹
        </div>
        <div className="text-left">
          <h2 className="font-bold text-white text-xl tracking-tight leading-tight">SmartExpense</h2>
          <p className="text-xs text-dark-400 font-medium">Hostel & Student Finance Planner</p>
        </div>
      </div>

      {/* Reset Password Card */}
      <div className="w-full max-w-md bg-dark-850 border border-dark-750 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-income-500/10 text-income-400 border border-income-500/20 flex items-center justify-center mx-auto">
              <FiCheckCircle className="text-2xl" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete</h1>
              <p className="text-xs sm:text-sm text-dark-300 mt-2 leading-relaxed">
                Your password has been securely updated and previous reset tokens have been invalidated.
              </p>
            </div>

            <div className="pt-4 border-t border-dark-750">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Sign In with New Password
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
              <p className="text-xs sm:text-sm text-dark-400 mt-1">
                Enter your reset token and choose a new, strong password.
              </p>
            </div>

            {serverError && (
              <ErrorAlert
                title="Reset Failed"
                message={serverError}
                className="mb-5"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* If token is not in URL, allow manual input */}
              <Input
                label="Reset Token"
                id="token"
                name="token"
                type="text"
                placeholder="Paste reset token here..."
                icon={FiKey}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                }}
                error={errors.token}
                required
              />

              <Input
                label="New Password"
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                icon={FiLock}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-type new password"
                icon={FiLock}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  Set New Password
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-dark-750 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-dark-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="text-base" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
