import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardOverview } from '../../features/dashboard/dashboardSlice';
import { fetchSpendingPace, fetchFinancialHealth, fetchMonthlyTrends } from '../../features/analytics/analyticsSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiPlus,
  FiArrowRight,
  FiTrendingUp,
  FiTrendingDown,
  FiShield,
  FiClock,
  FiArrowUpRight,
  FiArrowDownRight,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { getTransactionCurrencyDisplay, formatCurrency } from '../../utils/currency';
import { formatShortDate } from '../../utils/date';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { overview, loading: overviewLoading, error: overviewError } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);
  const { spendingPace, financialHealth, monthlyTrends } = useSelector((state) => state.analytics);

  const currencyCode = user?.currency || 'INR';

  const loadDashboardData = useCallback(() => {
    dispatch(fetchDashboardOverview({ displayCurrency: currencyCode }));
    dispatch(fetchSpendingPace({ displayCurrency: currencyCode }));
    dispatch(fetchFinancialHealth({ displayCurrency: currencyCode }));
    dispatch(fetchMonthlyTrends({ months: 6, displayCurrency: currencyCode }));
  }, [dispatch, currencyCode]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, currencyCode]);

  const currentBalance = overview?.currentBalance ?? 0;
  const monthlyIncome = overview?.monthlyIncome ?? 0;
  const monthlyExpenses = overview?.monthlyExpenses ?? 0;
  const recentTransactions = overview?.recentTransactions || [];
  const categorySummaries = overview?.categorySummaries || [];

  const safeDaily = spendingPace?.safeDailyLimit ?? (spendingPace?.dailySafeLimit ?? 0);
  const paceStatus = spendingPace?.status || spendingPace?.paceStatus || 'ON TRACK';

  // Pace badge variant
  const paceVariant =
    paceStatus === 'OVERSPENDING' || paceStatus === 'HIGH RISK'
      ? 'danger'
      : paceStatus === 'CAUTION'
      ? 'warning'
      : 'success';

  // Health score
  const healthScore = financialHealth?.score ?? financialHealth?.overallScore ?? null;
  const healthRating = financialHealth?.rating ?? (healthScore >= 80 ? 'EXCELLENT' : healthScore >= 60 ? 'GOOD' : healthScore >= 40 ? 'FAIR' : 'NEEDS ATTENTION');
  const healthVariant = healthScore >= 80 ? 'success' : healthScore >= 60 ? 'info' : healthScore >= 40 ? 'warning' : 'danger';

  // Format Recharts data
  const chartData = (monthlyTrends || []).map((item) => ({
    name: item.label || `${item.month}/${item.year}`,
    Income: item.income,
    Expenses: item.expenses,
  }));

  if (overviewLoading && !overview) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner size="xl" message="Loading your financial dashboard..." />
      </div>
    );
  }

  if (overviewError && !overview) {
    return (
      <div className="p-8 text-center bg-dark-900 border border-dark-800 rounded-3xl">
        <FiAlertCircle className="text-4xl text-expense-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Failed to load dashboard</h3>
        <p className="text-sm text-dark-400 mb-4">{overviewError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={loadDashboardData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-900 border border-dark-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">👋</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Student'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-dark-400">
            Here is your live financial balance, daily safe spending pace, and trends for this month.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={FiPlus}
            onClick={() => navigate('/transactions/add')}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <Card hoverable onClick={() => navigate('/transactions')}>
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
            <Badge variant={currentBalance >= 0 ? 'info' : 'danger'}>Real-Time</Badge>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${currentBalance < 0 ? 'text-expense-400' : 'text-white'}`}>
            {formatCurrency(currentBalance, currencyCode)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-400">
            <FiShield className="text-info-400" />
            <span>Net cumulative balance</span>
          </div>
        </Card>

        {/* Monthly Income */}
        <Card hoverable onClick={() => navigate('/transactions')}>
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Income</span>
            <Badge variant="success">Income</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-income-400 tracking-tight">
            +{formatCurrency(monthlyIncome, currencyCode)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-400">
            <FiTrendingUp className="text-income-400" />
            <span>Current month allowance</span>
          </div>
        </Card>

        {/* Total Spent */}
        <Card hoverable onClick={() => navigate('/transactions')}>
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
            <Badge variant="danger">Expense</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-expense-400 tracking-tight">
            -{formatCurrency(monthlyExpenses, currencyCode)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-400">
            <FiTrendingDown className="text-expense-400" />
            <span>Current month total</span>
          </div>
        </Card>

        {/* Safe Daily Limit */}
        <Card hoverable onClick={() => navigate('/spending-pace')}>
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Safe Daily Limit</span>
            <Badge variant={paceVariant}>{paceStatus}</Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-warning-400 tracking-tight">
            {formatCurrency(safeDaily, currencyCode)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-400">
            <FiClock className="text-warning-400" />
            <span>Safe daily burn rate</span>
          </div>
        </Card>
      </div>

      {/* Financial Health & Monthly Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>Visualizing your cash flow over the last 6 months</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={FiArrowRight}
              iconPosition="right"
              onClick={() => navigate('/analytics')}
            >
              Full Analytics
            </Button>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 && chartData.some((d) => d.Income > 0 || d.Expenses > 0) ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val) => formatCurrency(val, currencyCode)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '0.813rem',
                        color: '#f8fafc',
                      }}
                      formatter={(val) => [formatCurrency(Number(val), currencyCode)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center rounded-xl bg-dark-900/60 border border-dashed border-dark-750 text-center p-6">
                <FiTrendingUp className="text-3xl text-dark-500 mb-2" />
                <p className="text-sm font-medium text-dark-300">No Cash Flow Data Yet</p>
                <p className="text-xs text-dark-500 max-w-sm mt-1 mb-4">
                  Add your first income or expense transactions to view real monthly comparisons here.
                </p>
                <Button variant="secondary" size="sm" icon={FiPlus} onClick={() => navigate('/transactions/add')}>
                  Record Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Health Score Gauge */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Financial Health</CardTitle>
              <CardDescription>Live health score calculation</CardDescription>
            </div>
            {healthRating && <Badge variant={healthVariant}>{healthRating}</Badge>}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center pt-2">
            <div className="relative w-32 h-32 flex items-center justify-center my-3">
              <div className="w-full h-full rounded-full border-8 border-dark-750 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">
                    {healthScore !== null ? Math.round(healthScore) : '--'}
                  </span>
                  <span className="block text-[10px] text-dark-400 font-semibold uppercase tracking-wider">
                    Out of 100
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-dark-300 mt-2 line-clamp-3">
              {financialHealth?.summary ||
                (healthScore !== null
                  ? `Your financial discipline is currently rated ${healthRating}.`
                  : 'Start recording expenses and budgets to calculate your explainable financial health score.')}
            </p>

            <Button
              variant="secondary"
              size="sm"
              className="mt-5 w-full"
              onClick={() => navigate('/spending-pace')}
            >
              Inspect Pace & Safety
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Top Spending Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest entries recorded across your accounts</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={FiArrowRight}
              iconPosition="right"
              onClick={() => navigate('/transactions')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-dark-750/60">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const txDate = formatShortDate(tx.date);

                  return (
                    <div
                      key={tx._id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-dark-750/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${
                            isIncome
                              ? 'bg-income-500/15 text-income-400 border border-income-500/20'
                              : 'bg-expense-500/15 text-expense-400 border border-expense-500/20'
                          }`}
                        >
                          {isIncome ? <FiArrowUpRight /> : <FiArrowDownRight />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tx.category}</p>
                          <p className="text-xs text-dark-400 truncate">
                            {tx.description || txDate} • {txDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {(() => {
                          const currDisplay = getTransactionCurrencyDisplay(tx, currencyCode);
                          return (
                            <div className={isIncome ? 'text-income-400' : 'text-expense-400'}>
                              <span className="text-sm font-bold">{isIncome ? '+' : '-'}{currDisplay.primaryText}</span>
                              {currDisplay.secondaryText && (
                                <span className="block text-[11px] font-normal text-dark-400">
                                  {currDisplay.secondaryText}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-dark-400">
                <p className="text-sm mb-3">No transactions found</p>
                <Button variant="secondary" size="sm" icon={FiPlus} onClick={() => navigate('/transactions/add')}>
                  Add your first entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Categories */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Monthly expense allocation</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={FiArrowRight}
              iconPosition="right"
              onClick={() => navigate('/budgets')}
            >
              Budgets
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySummaries.length > 0 ? (
              categorySummaries.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-white truncate">{cat.category}</span>
                    <span className="text-dark-400 shrink-0">
                      {formatCurrency(Number(cat.total || 0), currencyCode)} ({Number(cat.percentage || 0).toFixed(0)}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={Number(cat.percentage || 0)}
                    max={100}
                    color={cat.percentage > 40 ? 'rose' : cat.percentage > 20 ? 'amber' : 'emerald'}
                    size="sm"
                  />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-dark-500">
                <p className="text-xs">No expense breakdown recorded this month yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
