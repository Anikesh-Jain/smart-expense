import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../features/auth/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // If already authenticated, redirect to target page or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Welcome back!');
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
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

      {/* Login Card */}
      <div className="w-full max-w-md bg-dark-850 border border-dark-750 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Enter your credentials to access your financial dashboard.
          </p>
        </div>

        {error && (
          <ErrorAlert
            title="Authentication Error"
            message={error}
            className="mb-5"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="you@college.edu"
            icon={FiMail}
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={FiLock}
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-end -mt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-info-400 hover:text-info-300 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-dark-750 text-center">
          <p className="text-xs sm:text-sm text-dark-400">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-info-400 hover:text-info-300 font-medium transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
