import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { FiDollarSign, FiCalendar, FiShield, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../../utils/currency';

const OnboardingPage = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    monthlyIncome: user?.monthlyIncome || '',
    fixedExpenses: user?.fixedExpenses || '',
    savingsTarget: user?.savingsTarget || '',
    incomeDay: user?.incomeDay || 1,
    currency: user?.currency || 'INR',
  });

  const initialSynced = React.useRef(false);

  React.useEffect(() => {
    if (user && !initialSynced.current) {
      initialSynced.current = true;
      setFormData({
        monthlyIncome: user.monthlyIncome ?? '',
        fixedExpenses: user.fixedExpenses ?? '',
        savingsTarget: user.savingsTarget ?? '',
        incomeDay: user.incomeDay ?? 1,
        currency: user.currency ?? 'INR',
      });
    }
  }, [user]);

  const activeCurrencySymbol = getCurrencySymbol(formData.currency);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      monthlyIncome: Number(formData.monthlyIncome) || 0,
      fixedExpenses: Number(formData.fixedExpenses) || 0,
      savingsTarget: Number(formData.savingsTarget) || 0,
      incomeDay: Number(formData.incomeDay) || 1,
      currency: formData.currency,
      profileBaseCurrency: formData.currency,
      onboardingCompleted: true,
    };

    const result = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Financial profile set up successfully!');
      navigate('/', { replace: true });
    }
  };

  const handleSkip = async () => {
    await dispatch(updateProfile({ onboardingCompleted: true }));
    toast('You can configure your finances anytime in Settings.', { icon: 'ℹ️' });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-3.5 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-dark-850 border border-dark-750 rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-info-500/15 text-info-400 mb-3 border border-info-500/20">
            <FiShield className="text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Financial Baseline Setup
          </h1>
          <p className="text-xs sm:text-sm text-dark-400 mt-2 max-w-md mx-auto">
            Tell us about your typical monthly allowance or stipend so we can calculate your safe daily spending pace and runout dates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Monthly Allowance / Income (${activeCurrencySymbol})`}
              id="monthlyIncome"
              name="monthlyIncome"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 10000"
              icon={FiDollarSign}
              value={formData.monthlyIncome}
              onChange={handleChange}
              helperText="Pocket money, stipend, or salary"
            />

            <Input
              label={`Fixed Expenses (${activeCurrencySymbol})`}
              id="fixedExpenses"
              name="fixedExpenses"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 3000"
              icon={FiShield}
              value={formData.fixedExpenses}
              onChange={handleChange}
              helperText="Mess fees, hostel rent, phone recharge"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Monthly Savings Target (${activeCurrencySymbol})`}
              id="savingsTarget"
              name="savingsTarget"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 2000"
              icon={FiTrendingUp}
              value={formData.savingsTarget}
              onChange={handleChange}
              helperText="How much you aim to save each month"
            />

            <Input
              label="Allowance Arrival Day"
              id="incomeDay"
              name="incomeDay"
              type="number"
              min="1"
              max="31"
              placeholder="1"
              icon={FiCalendar}
              value={formData.incomeDay}
              onChange={handleChange}
              helperText="Day of month funds arrive (1-31)"
            />
          </div>

          <Select
            label="Currency"
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            options={[
              { value: 'INR', label: 'INR (₹) - Indian Rupee' },
              { value: 'USD', label: 'USD ($) - US Dollar' },
              { value: 'EUR', label: 'EUR (€) - Euro' },
              { value: 'GBP', label: 'GBP (£) - British Pound' },
            ]}
          />

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto order-2 sm:order-1"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full sm:flex-1 order-1 sm:order-2"
            >
              Complete Setup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
