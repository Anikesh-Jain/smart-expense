import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchSpendingPace,
  fetchWillMoneyLast,
  fetchSmartSuggestions,
} from '../../features/analytics/analyticsSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiClock,
  FiCalendar,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiCompass,
  FiZap,
  FiRefreshCw
} from 'react-icons/fi';

import { formatCurrency } from '../../utils/currency';
import { formatFullDate } from '../../utils/date';

const SpendingPacePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { spendingPace, willMoneyLast, suggestions, loading } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';

  const loadData = useCallback(() => {
    dispatch(fetchSpendingPace({ displayCurrency: currencyCode }));
    dispatch(fetchWillMoneyLast({ displayCurrency: currencyCode }));
    dispatch(fetchSmartSuggestions({ displayCurrency: currencyCode }));
  }, [dispatch, currencyCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Normalize spending pace status
  const rawStatus = (spendingPace?.status || 'on_track').toLowerCase();
  const paceStatusLabel =
    rawStatus === 'overspending' ? 'OVERSPENDING' : rawStatus === 'caution' ? 'CAUTION' : 'ON TRACK';

  const paceVariant =
    rawStatus === 'overspending' ? 'danger' : rawStatus === 'caution' ? 'warning' : 'success';

  // Normalize Will My Money Last status
  const runoutStatus = willMoneyLast?.status || 'SAFE';
  const runoutVariant =
    runoutStatus === 'HIGH_RISK' ? 'danger' : runoutStatus === 'CAUTION' ? 'warning' : 'success';

  const daysElapsed = Math.max(1, Number(spendingPace?.daysElapsed || 1));
  const daysInMonth = Math.max(1, Number(spendingPace?.daysInMonth || 30));
  const daysRemaining = Math.max(0, Number(spendingPace?.daysRemaining ?? (daysInMonth - daysElapsed)));
  const monthProgressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / daysInMonth) * 100)));

  const avgDaily = Number(spendingPace?.averageDailySpending || 0);
  const safeDaily = Number(spendingPace?.safeDailyLimit || 0);
  const safeWeekly = Number(spendingPace?.safeWeeklyLimit || 0);
  const projectedSpend = Number(spendingPace?.projectedMonthlySpending || 0);
  const projectedBalance = Number(spendingPace?.projectedEndOfMonthBalance || 0);

  if (loading && !spendingPace) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner size="xl" message="Calculating your spending pace & runout projections..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Spending Pace Analysis</h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Monitor your daily burn rate so you don't overspend during early weeks and struggle before month-end.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="sm" icon={FiRefreshCw} onClick={loadData} className="flex-1 sm:flex-initial">
            Refresh Pace
          </Button>
          <Button variant="primary" size="sm" icon={FiZap} onClick={() => navigate('/saving-plan')} className="flex-1 sm:flex-initial">
            Smart Saving Plan
          </Button>
        </div>
      </div>

      {/* Pace Status Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 ${
          rawStatus === 'overspending'
            ? 'bg-expense-500/10 border-expense-500/30 text-expense-300'
            : rawStatus === 'caution'
            ? 'bg-warning-500/10 border-warning-500/30 text-warning-300'
            : 'bg-income-500/10 border-income-500/30 text-income-300'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold ${
              rawStatus === 'overspending'
                ? 'bg-expense-500/20 text-expense-400'
                : rawStatus === 'caution'
                ? 'bg-warning-500/20 text-warning-400'
                : 'bg-income-500/20 text-income-400'
            }`}
          >
            {rawStatus === 'overspending' ? (
              <FiAlertCircle />
            ) : rawStatus === 'caution' ? (
              <FiAlertTriangle />
            ) : (
              <FiCheckCircle />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-base">Pacing Status:</span>
              <Badge variant={paceVariant}>{paceStatusLabel}</Badge>
            </div>
            <p className="text-xs sm:text-sm mt-1 text-dark-200 break-words">
              {spendingPace?.message || 'Your daily spending pace is being calculated against your current balance.'}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t border-dark-750/50 sm:border-0 w-full sm:w-auto">
          <span className="text-xs text-dark-400 block font-medium">Safe Daily Limit</span>
          <span className="text-xl font-extrabold text-white">
            {formatCurrency(safeDaily, currencyCode)}/day
          </span>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Safe Daily Limit */}
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Safe Daily Limit</span>
            <FiClock className="text-warning-400" />
          </div>
          <p className="text-2xl font-bold text-warning-400 tracking-tight truncate">
            {formatCurrency(safeDaily, currencyCode)}
          </p>
          <span className="text-[11px] text-dark-400 mt-1 block">For next {daysRemaining} days</span>
        </Card>

        {/* Safe Weekly Limit */}
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Safe Weekly Limit</span>
            <FiCalendar className="text-info-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight truncate">
            {formatCurrency(safeWeekly, currencyCode)}
          </p>
          <span className="text-[11px] text-dark-400 mt-1 block">Recommended weekly cap</span>
        </Card>

        {/* Current Daily Burn Rate */}
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Burn Rate</span>
            <FiTrendingDown className="text-expense-400" />
          </div>
          <p className="text-2xl font-bold text-expense-400 tracking-tight truncate">
            {formatCurrency(avgDaily, currencyCode)}
          </p>
          <span className="text-[11px] text-dark-400 mt-1 block">Avg spend/day so far</span>
        </Card>

        {/* Projected Monthly Spend */}
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Spend</span>
            <FiCompass className="text-dark-300" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight truncate">
            {formatCurrency(projectedSpend, currencyCode)}
          </p>
          <span className="text-[11px] text-dark-400 mt-1 block">Month-end projection</span>
        </Card>

        {/* Projected End Balance */}
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Balance</span>
            <Badge variant={projectedBalance >= 0 ? 'success' : 'danger'}>
              {projectedBalance >= 0 ? 'Surplus' : 'Deficit'}
            </Badge>
          </div>
          <p className={`text-2xl font-bold tracking-tight truncate ${projectedBalance < 0 ? 'text-expense-400' : 'text-income-400'}`}>
            {formatCurrency(projectedBalance, currencyCode)}
          </p>
          <span className="text-[11px] text-dark-400 mt-1 block">On last day of month</span>
        </Card>
      </div>

      {/* Month Timeline Progress & Will My Money Last Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month Timeline Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Month Timeline Progress</CardTitle>
              <CardDescription>
                Day {daysElapsed} of {daysInMonth} ({daysRemaining} days remaining)
              </CardDescription>
            </div>
            <Badge variant="neutral">{monthProgressPct}% passed</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={monthProgressPct} max={100} color="blue" size="lg" />

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-750">
                <span className="text-dark-400 block font-medium">Days Elapsed</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{daysElapsed} Days</span>
                <span className="text-[11px] text-dark-400">Recorded spending history</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-750">
                <span className="text-dark-400 block font-medium">Days Remaining</span>
                <span className="text-lg font-bold text-warning-400 mt-0.5 block">{daysRemaining} Days</span>
                <span className="text-[11px] text-dark-400">Remaining to be funded</span>
              </div>
            </div>

            <p className="text-xs text-dark-300 leading-relaxed pt-1">
              To finish the month without a cash deficit, keep your total spending across the remaining {daysRemaining} days below{' '}
              <strong className="text-white">
                {formatCurrency(spendingPace?.availableBalance || 0, currencyCode)}
              </strong>.
            </p>
          </CardContent>
        </Card>

        {/* Will My Money Last Card (Requirement 8) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Will My Money Last?</CardTitle>
              <CardDescription>Cash runout projection engine</CardDescription>
            </div>
            <Badge variant={runoutVariant}>{runoutStatus.replace('_', ' ')}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900 border border-dark-750">
              <div>
                <span className="text-xs text-dark-400 font-medium block">Days Money Can Last</span>
                <span className="text-3xl font-extrabold text-white mt-1 block">
                  {willMoneyLast?.daysSupported ?? '--'} Days
                </span>
              </div>
              {willMoneyLast?.shortfallDate && (
                <div className="text-right">
                  <span className="text-xs text-expense-400 font-medium block">Projected Shortfall</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {formatFullDate(willMoneyLast.shortfallDate)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-dark-850 border border-dark-750">
              <p className="text-xs sm:text-sm text-dark-200 leading-relaxed">
                {willMoneyLast?.explanation ||
                  'Your daily spending rate is safely supported by your current available balance.'}
              </p>
            </div>

            {willMoneyLast?.shortfallDate && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-expense-500/10 border border-expense-500/30 text-xs text-expense-300">
                <FiAlertCircle className="text-base shrink-0 text-expense-400" />
                <span>
                  Action needed: Reduce daily discretionary expenditure by at least{' '}
                  <strong>
                    {formatCurrency(Math.max(1, Math.round(avgDaily - safeDaily)), currencyCode)}/day
                  </strong>{' '}
                  to prevent running out of money before month-end.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions Based on Actual Spending */}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Personalized Financial Suggestions</CardTitle>
              <CardDescription>Tailored advice generated from your real transactions</CardDescription>
            </div>
            <span className="text-xs text-dark-400 bg-dark-900 px-2.5 py-1 rounded-full border border-dark-750">
              {suggestions.length} tips
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((sugg) => {
              const isUrgent = sugg.priority === 'urgent' || sugg.type === 'warning';
              const isAction = sugg.type === 'action' || sugg.type === 'saving_opportunity';

              return (
                <div
                  key={sugg.id || sugg.title}
                  className="p-4 rounded-xl bg-dark-900 border border-dark-750 flex items-start gap-3.5"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base ${
                      isUrgent
                        ? 'bg-expense-500/20 text-expense-400'
                        : isAction
                        ? 'bg-info-500/20 text-info-400'
                        : 'bg-income-500/20 text-income-400'
                    }`}
                  >
                    {isUrgent ? <FiAlertTriangle /> : isAction ? <FiZap /> : <FiCheckCircle />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">{sugg.title}</h4>
                      <Badge variant={isUrgent ? 'danger' : isAction ? 'info' : 'success'} size="sm">
                        {sugg.priority?.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">{sugg.message}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpendingPacePage;
