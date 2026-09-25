import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FiLock, FiCheckCircle, FiArrowLeft, FiMail, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') || '';
  const token = (routeToken || queryToken || '').trim();

  const [email, setEmail] = useState('');
  const [tokenError, setTokenError] = useState(() =>
    !token ? 'No reset token provided. Please use the password reset link sent to your email.' : ''
  );
  const [isValidatingToken, setIsValidatingToken] = useState(() => Boolean(token));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  // Validate reset token with backend on mount and fetch associated email
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifyToken = async () => {
      setTokenError('');
      try {
        const res = await API.get(`/auth/reset-password/${token}`);
        if (isMounted && res.data?.data?.email) {
          setEmail(res.data.data.email);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err.response?.data?.message || 'Invalid or expired password reset link. Please request a new one.';
          setTokenError(msg);
        }
      } finally {
        if (isMounted) {
          setIsValidatingToken(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const validate = () => {
    const errs = {};
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
      const res = await API.post(`/auth/reset-password/${token}`, {
        password
      });

      setIsSuccess(true);
      toast.success(res.data?.message || 'Password reset successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password. Link may be expired.';
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
        ) : isValidatingToken ? (
          <div className="py-8 text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-dark-300">Verifying password reset link...</p>
          </div>
        ) : tokenError ? (
          <div className="space-y-5 text-center">
            <ErrorAlert
              title="Invalid Reset Link"
              message={tokenError}
            />
            <p className="text-xs text-dark-400 leading-relaxed">
              Reset links expire after 15 minutes and can only be used once. Please request a new password reset link.
            </p>
            <div className="space-y-3 pt-2">
              <Link
                to="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-info-600 hover:bg-info-500 text-white text-sm font-semibold transition-colors"
              >
                <FiRefreshCw className="text-base" /> Request New Reset Link
              </Link>
              <div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-dark-400 hover:text-white transition-colors pt-2"
                >
                  <FiArrowLeft className="text-base" /> Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
              <p className="text-xs sm:text-sm text-dark-400 mt-1">
                Choose a new, strong password for your account.
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
              {/* Email field (read-only for security, correctly identified as username for password managers) */}
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={email}
                readOnly
                autoComplete="username"
                icon={FiMail}
                className="cursor-default bg-dark-900/60 text-dark-300 border-dark-750"
                helperText="Account associated with this secure reset link"
                required
              />

              {/* New Password */}
              <Input
                label="New Password"
                id="newPassword"
                name="newPassword"
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

              {/* Confirm New Password */}
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
