import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await API.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSubmitted(true);
      toast.success('Password reset instructions processed');
    } catch (error) {
      // Backend returns generic success response for security, but handle network/500 errors gracefully
      const msg = error.response?.data?.message || 'Unable to process request. Please try again later.';
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

      {/* Forgot Password Card */}
      <div className="w-full max-w-md bg-dark-850 border border-dark-750 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-income-500/10 text-income-400 border border-income-500/20 flex items-center justify-center mx-auto">
              <FiCheckCircle className="text-2xl" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Check Your Inbox</h1>
              <p className="text-xs sm:text-sm text-dark-300 mt-2 leading-relaxed">
                If an account exists for <span className="font-medium text-white">{email}</span>, password reset instructions have been generated.
              </p>
            </div>

            <p className="text-xs text-dark-400">
              For security, we do not disclose whether an email address is registered on our platform.
            </p>

            <div className="pt-4 border-t border-dark-750">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-info-400 hover:text-info-300 transition-colors"
              >
                <FiArrowLeft className="text-base" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h1>
              <p className="text-xs sm:text-sm text-dark-400 mt-1">
                Enter your registered email address and we will generate secure password reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Registered Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="you@college.edu"
                icon={FiMail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                autoComplete="email"
                required
                autoFocus
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  Send Reset Link
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

export default ForgotPasswordPage;
