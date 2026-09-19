import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthlyTrends, fetchCategoryBreakdown } from '../../features/analytics/analyticsSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiTrendingUp,
  FiPieChart,
  FiBarChart2
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

import { getCurrencySymbol, formatCurrency } from '../../utils/currency';

const CHART_COLORS = [
  '#38bdf8', // sky-400
  '#f43f5e', // rose-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
];

const AnalyticsPage = () => {
  const dispatch = useDispatch();

  const { monthlyTrends, categoryBreakdown, loading } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currencyCode);

  const [monthsRange, setMonthsRange] = useState(6); // 6 or 12

  useEffect(() => {
    dispatch(fetchMonthlyTrends({ months: monthsRange, displayCurrency: currencyCode }));
    dispatch(fetchCategoryBreakdown({ type: 'expense', displayCurrency: currencyCode }));
  }, [dispatch, monthsRange, currencyCode]);

  // Check if any financial data exists
  const hasMonthlyData = monthlyTrends && monthlyTrends.length > 0 && monthlyTrends.some((d) => d.income > 0 || d.expenses > 0);
  const hasCategoryData = categoryBreakdown?.categories && categoryBreakdown.categories.length > 0;

  // Compute summary totals for selected range
  const totalPeriodIncome = (monthlyTrends || []).reduce((sum, d) => sum + (d.income || 0), 0);
  const totalPeriodExpenses = (monthlyTrends || []).reduce((sum, d) => sum + (d.expenses || 0), 0);
  const netSavingsPeriod = totalPeriodIncome - totalPeriodExpenses;
  const savingsRate = totalPeriodIncome > 0 ? Math.round((netSavingsPeriod / totalPeriodIncome) * 100) : 0;

  // Prepare PieChart data
  const pieData = (categoryBreakdown?.categories || []).map((cat) => ({
    name: cat.category,
    value: cat.total,
    percentage: cat.percentage,
    count: cat.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Financial Analytics</h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Deep dive into your multi-month income flows, expense distributions, and cash reserves.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400 font-medium">Timeline:</span>
          <div className="flex items-center bg-dark-850 border border-dark-750 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMonthsRange(6)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                monthsRange === 6
                  ? 'bg-info-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              onClick={() => setMonthsRange(12)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                monthsRange === 12
                  ? 'bg-info-600 text-white shadow-sm'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Last 12 Months
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inflow</span>
            <Badge variant="success">Income</Badge>
          </div>
          <p className="text-2xl font-bold text-income-400 tracking-tight">
            +{formatCurrency(totalPeriodIncome, currencyCode)}
          </p>
          <span className="text-xs text-dark-400 mt-1 block">In last {monthsRange} months</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outflow</span>
            <Badge variant="danger">Expense</Badge>
          </div>
          <p className="text-2xl font-bold text-expense-400 tracking-tight">
            -{formatCurrency(totalPeriodExpenses, currencyCode)}
          </p>
          <span className="text-xs text-dark-400 mt-1 block">In last {monthsRange} months</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Cash Flow</span>
            <Badge variant={netSavingsPeriod >= 0 ? 'info' : 'danger'}>
              {netSavingsPeriod >= 0 ? 'Surplus' : 'Deficit'}
            </Badge>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${netSavingsPeriod < 0 ? 'text-expense-400' : 'text-white'}`}>
            {netSavingsPeriod < 0 ? '-' : '+'}{formatCurrency(Math.abs(netSavingsPeriod), currencyCode)}
          </p>
          <span className="text-xs text-dark-400 mt-1 block">Inflow minus outflow</span>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-dark-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
            <Badge variant={savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'danger'}>
              {savingsRate}%
            </Badge>
          </div>
          <p className="text-2xl font-bold text-warning-400 tracking-tight">
            {savingsRate}%
          </p>
          <span className="text-xs text-dark-400 mt-1 block">Of total period allowance</span>
        </Card>
      </div>

      {loading && !monthlyTrends?.length ? (
        <div className="py-24 text-center">
          <LoadingSpinner size="xl" message="Computing chart metrics..." />
        </div>
      ) : !hasMonthlyData && !hasCategoryData ? (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={FiBarChart2}
              title="No Analytics Data Available"
              description="Record your monthly allowances and daily expenses to generate real-time bar charts, category distributions, and multi-month trends."
              action={
                <Button variant="primary" icon={FiTrendingUp} onClick={() => window.location.href = '/transactions/add'}>
                  Add Transaction Data
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Inflow vs Outflow Bar Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Cash Flow Comparison</CardTitle>
                  <CardDescription>Income vs Expense breakdown over {monthsRange} months</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(val) => {
                          if (Math.abs(val) >= 1000) {
                            const kVal = val / 1000;
                            return `${currencySymbol}${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}k`;
                          }
                          return formatCurrency(val, currencyCode, false);
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          fontSize: '0.813rem',
                        }}
                        formatter={(val) => [formatCurrency(val, currencyCode)]}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Donut Distribution */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Current month expense shares</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              borderColor: '#334155',
                              borderRadius: '0.75rem',
                              fontSize: '0.813rem',
                              color: '#f8fafc',
                            }}
                            formatter={(val, name, entry) => [
                              `${formatCurrency(val, currencyCode)} (${entry.payload.percentage}%)`,
                              name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category Legend List */}
                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                      {pieData.map((cat, idx) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span className="text-white truncate">{cat.name}</span>
                          </div>
                          <span className="text-dark-300 font-semibold shrink-0">
                            {formatCurrency(cat.value, currencyCode)} ({cat.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-dark-500">
                    <FiPieChart className="text-3xl mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No expense breakdown recorded this month.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Net Savings Trend Over Time */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Net Monthly Savings Trajectory</CardTitle>
                <CardDescription>
                  Tracking monthly net cash flow (Income minus Expenses)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (Math.abs(val) >= 1000) {
                          const kVal = val / 1000;
                          return `${currencySymbol}${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}k`;
                        }
                        return formatCurrency(val, currencyCode, false);
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '0.813rem',
                      }}
                      formatter={(val) => [formatCurrency(val, currencyCode), 'Net Savings']}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="netSavings"
                      name="Net Savings"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ fill: '#38bdf8', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
