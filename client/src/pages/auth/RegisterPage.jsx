import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { name, email, password } = formData;
    const resultAction = await dispatch(registerUser({ name: name.trim(), email: email.trim(), password }));

    if (registerUser.fulfilled.match(resultAction)) {
      toast.success('Account created successfully! Let’s set up your finances.');
      navigate('/onboarding', { replace: true });
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

      {/* Register Card */}
      <div className="w-full max-w-md bg-dark-850 border border-dark-750 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Join to start budgeting your pocket money and tracking daily pace.
          </p>
        </div>

        {error && (
          <ErrorAlert
            title="Registration Failed"
            message={error}
            className="mb-5"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            id="name"
            name="name"
            type="text"
            placeholder="Rahul Sharma"
            icon={FiUser}
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="rahul@college.edu"
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
            placeholder="At least 6 characters"
            icon={FiLock}
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            autoComplete="new-password"
            required
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            icon={FiLock}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            autoComplete="new-password"
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-dark-750 text-center">
          <p className="text-xs sm:text-sm text-dark-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-info-400 hover:text-info-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
