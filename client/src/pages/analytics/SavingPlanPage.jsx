import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { generateSavingPlan, clearSavingPlan } from '../../features/analytics/analyticsSlice';
import { createSavingsGoal } from '../../features/savings/savingsSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiZap,
  FiTarget,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiScissors,
  FiShield,
  FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

const SavingPlanPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { savingPlan, loading } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currencyCode);

  useEffect(() => {
    dispatch(clearSavingPlan());
  }, [currencyCode, dispatch]);

  // Minimum date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalCreatedLoading, setGoalCreatedLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const amountNum = Number(targetAmount);
    if (!targetAmount || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a target amount greater than 0');
      return;
    }
    if (!targetDate) {
      toast.error('Please select a future target date');
      return;
    }

    const selectedDate = new Date(targetDate);
    const now = new Date();
    if (isNaN(selectedDate.getTime()) || selectedDate <= now) {
      toast.error('Please select a valid future deadline date');
      return;
    }

    const payload = {
      targetAmount: amountNum,
      targetDate,
      currency: currencyCode,
    };

    const result = await dispatch(generateSavingPlan(payload));
    if (generateSavingPlan.fulfilled.match(result)) {
      toast.success('Smart saving plan generated!');
    } else {
      toast.error(result.payload || 'Failed to calculate saving plan');
    }
  };

  const handleCreateAsGoal = async () => {
    if (!savingPlan) return;
    setGoalCreatedLoading(true);

    const result = await dispatch(
      createSavingsGoal({
        title: `Goal: Save ${formatCurrency(savingPlan.targetAmount, currencyCode)}`,
        targetAmount: Number(savingPlan.targetAmount || 0),
        targetDate: savingPlan.targetDate,
        currency: currencyCode,
        description: `Plan feasibility: ${savingPlan.feasibility?.status}. Required: ${formatCurrency(Number(savingPlan.requiredSavings?.monthly || 0), currencyCode)}/mo`,
      })
    );
    setGoalCreatedLoading(false);

    if (createSavingsGoal.fulfilled.match(result)) {
      toast.success('Saved to your Savings Goals!');
      navigate('/savings');
    } else {
      toast.error(result.payload || 'Failed to create goal');
    }
  };

  const feasibility = savingPlan?.feasibility?.status || 'REALISTIC';
  const feasibilityVariant =
    feasibility === 'REALISTIC' || feasibility === 'MODERATE'
      ? 'success'
      : feasibility === 'CHALLENGING'
      ? 'warning'
      : 'danger';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Smart Saving Planner</h2>
        <p className="text-xs sm:text-sm text-dark-400 mt-1">
          Calculate the exact daily, weekly, and monthly savings needed to reach your student financial targets.
        </p>
      </div>

      {/* Plan Parameters Form Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Plan Parameters</CardTitle>
            <CardDescription>Enter your savings target and deadline</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Target Amount (${currencySymbol})`}
                type="number"
                min="100"
                step="100"
                placeholder="e.g. 12000"
                icon={FiDollarSign}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                helperText="How much you want to accumulate"
              />

              <Input
                label="Target Date"
                type="date"
                icon={FiCalendar}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={minDateStr}
                required
                helperText="Future date by which you need the funds"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {savingPlan && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(clearSavingPlan())}
                >
                  Reset
                </Button>
              )}
              <Button type="submit" variant="primary" loading={loading} icon={FiZap}>
                Generate Saving Plan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Plan Results */}
      {loading && !savingPlan && (
        <div className="py-16 text-center">
          <LoadingSpinner size="lg" message="Simulating savings timeline and category reduction potential..." />
        </div>
      )}

      {savingPlan && (
        <div className="space-y-6 animate-fade-in">
          {/* Feasibility Verdict Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              feasibilityVariant === 'danger'
                ? 'bg-expense-500/10 border-expense-500/30 text-expense-200'
                : feasibilityVariant === 'warning'
                ? 'bg-warning-500/10 border-warning-500/30 text-warning-200'
                : 'bg-income-500/10 border-income-500/30 text-income-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold ${
                  feasibilityVariant === 'danger'
                    ? 'bg-expense-500/20 text-expense-400'
                    : feasibilityVariant === 'warning'
                    ? 'bg-warning-500/20 text-warning-400'
                    : 'bg-income-500/20 text-income-400'
                }`}
              >
                {feasibilityVariant === 'danger' ? (
                  <FiAlertTriangle />
                ) : feasibilityVariant === 'warning' ? (
                  <FiClock />
                ) : (
                  <FiCheckCircle />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">Feasibility Assessment:</span>
                  <Badge variant={feasibilityVariant}>{feasibility}</Badge>
                </div>
                <p className="text-xs sm:text-sm mt-1 text-dark-200 leading-relaxed">
                  {savingPlan.feasibility?.note}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={FiTarget}
              loading={goalCreatedLoading}
              onClick={handleCreateAsGoal}
              className="sm:shrink-0"
            >
              Save as Goal
            </Button>
          </div>

          {/* Required Savings Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Daily Target</span>
                <FiClock className="text-warning-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                {formatCurrency(Number(savingPlan.requiredSavings?.daily || 0), currencyCode)}
              </p>
              <span className="text-xs text-dark-400 mt-1 block">
                Required per day for {savingPlan.daysRemaining || 0} days
              </span>
            </Card>

            <Card>
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Weekly Target</span>
                <FiCalendar className="text-info-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-info-400 tracking-tight truncate">
                {formatCurrency(Number(savingPlan.requiredSavings?.weekly || 0), currencyCode)}
              </p>
              <span className="text-xs text-dark-400 mt-1 block">
                Required per week for {savingPlan.weeksRemaining || 0} weeks
              </span>
            </Card>

            <Card>
              <div className="flex items-center justify-between text-dark-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Target</span>
                <FiTrendingUp className="text-income-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-income-400 tracking-tight truncate">
                {formatCurrency(Number(savingPlan.requiredSavings?.monthly || 0), currencyCode)}
              </p>
              <span className="text-xs text-dark-400 mt-1 block">
                Required per month (~{savingPlan.monthsRemaining} months)
              </span>
            </Card>
          </div>

          {/* Category Reduction Suggestions */}
          {savingPlan.suggestedReductions && savingPlan.suggestedReductions.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Realistic Category Reduction Tips</CardTitle>
                  <CardDescription>
                    Achieve your required savings by trimming non-essential student expenses
                  </CardDescription>
                </div>
                <Badge variant="info">Optimization</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {savingPlan.suggestedReductions.map((tip) => (
                  <div
                    key={tip.category}
                    className="p-4 rounded-xl bg-dark-900 border border-dark-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-info-500/15 text-info-400 border border-info-500/20 flex items-center justify-center shrink-0">
                        <FiScissors className="text-base" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{tip.category}</h4>
                        <p className="text-xs text-dark-300 mt-0.5">{tip.explanation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-dark-400 block">Current Spend</span>
                        <span className="font-semibold text-dark-200">
                          {formatCurrency(tip.currentMonthlySpend || 0, currencyCode)}/mo
                        </span>
                      </div>
                      <FiArrowRight className="text-dark-500 hidden sm:block" />
                      <div className="text-right">
                        <span className="text-income-400 block font-semibold">Monthly Savings</span>
                        <span className="text-sm font-bold text-income-400">
                          +{formatCurrency(tip.suggestedMonthlyCut || 0, currencyCode)}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 text-xs text-dark-400 flex items-start gap-2.5">
            <FiShield className="text-base shrink-0 text-dark-300 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Financial Disclaimer:</strong> {savingPlan.disclaimer || 'These projections and suggested category reductions are estimates based on your parameters and do not guarantee future savings.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingPlanPage;
