import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBudgets,
  fetchCurrentBudget,
  createBudget,
  deleteBudget,
} from '../../features/budgets/budgetSlice';
import { fetchCategories } from '../../features/categories/categorySlice';
import { fetchCategoryBreakdown } from '../../features/analytics/analyticsSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FiPieChart,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiDollarSign
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { getCurrencySymbol, getBudgetCurrencyDisplay, formatCurrency, SUPPORTED_CURRENCIES } from '../../utils/currency';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetsPage = () => {
  const dispatch = useDispatch();

  const { budgets, currentBudget, loading } = useSelector((state) => state.budgets);
  const { categories } = useSelector((state) => state.categories);
  const { categoryBreakdown } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.auth);

  const currencyCode = user?.currency || 'INR';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states for creating/editing budget
  const [budgetTotal, setBudgetTotal] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState(user?.currency || 'INR');
  const [categoryAllocations, setCategoryAllocations] = useState({});

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Load budgets & categories
  const loadData = useCallback(() => {
    dispatch(fetchBudgets({ displayCurrency: currencyCode }));
    dispatch(fetchCurrentBudget({ displayCurrency: currencyCode }));
    dispatch(fetchCategories());
    dispatch(fetchCategoryBreakdown({ month: selectedMonth, year: selectedYear, type: 'expense', displayCurrency: currencyCode }));
  }, [dispatch, selectedMonth, selectedYear, currencyCode]);

  useEffect(() => {
    loadData();
  }, [loadData, currencyCode]);

  // Find budget for currently selected month and year
  const activeBudget =
    budgets.find((b) => b.month === selectedMonth && b.year === selectedYear) ||
    (currentBudget?.month === selectedMonth && currentBudget?.year === selectedYear ? currentBudget : null);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
  };

  // Open modal for create or edit
  const handleOpenModal = () => {
    if (activeBudget) {
      setBudgetTotal(activeBudget.totalBudget || '');
      setBudgetCurrency(activeBudget.currency || user?.currency || 'INR');
      const existingAllocations = {};
      (activeBudget.categoryBudgets || []).forEach((cb) => {
        existingAllocations[cb.category] = cb.amount;
      });
      setCategoryAllocations(existingAllocations);
    } else {
      setBudgetTotal('');
      setBudgetCurrency(user?.currency || 'INR');
      setCategoryAllocations({});
    }
    setIsModalOpen(true);
  };

  // Handle category allocation change
  const handleAllocationChange = (categoryName, val) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [categoryName]: val,
    }));
  };

  // Save budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetTotal || Number(budgetTotal) <= 0) {
      toast.error('Please enter a valid total monthly budget');
      return;
    }

    const formattedCategoryBudgets = Object.entries(categoryAllocations)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount),
      }));

    setModalLoading(true);
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      totalBudget: Number(budgetTotal),
      currency: budgetCurrency || user?.currency || 'INR',
      categoryBudgets: formattedCategoryBudgets,
    };

    const result = await dispatch(createBudget(payload));
    setModalLoading(false);

    if (createBudget.fulfilled.match(result)) {
      toast.success(`Budget for ${monthNames[selectedMonth - 1]} ${selectedYear} saved!`);
      setIsModalOpen(false);
      loadData();
    } else {
      toast.error(result.payload || 'Failed to save budget');
    }
  };

  // Delete budget
  const handleConfirmDelete = async () => {
    if (!activeBudget?._id) return;
    const result = await dispatch(deleteBudget(activeBudget._id));
    setIsDeleteOpen(false);
    if (deleteBudget.fulfilled.match(result)) {
      toast.success('Budget deleted');
      loadData();
    } else {
      toast.error(result.payload || 'Failed to delete budget');
    }
  };

  // Budget currency & presentation calculations
  const budgetDisplay = getBudgetCurrencyDisplay(activeBudget, currencyCode);
  const totalSpent = categoryBreakdown?.grandTotal || 0;
  const totalBudgetAmount = budgetDisplay.displayAmount;
  const remainingBudget = totalBudgetAmount - totalSpent;
  const overallPercentage = totalBudgetAmount > 0 ? Math.round((totalSpent / totalBudgetAmount) * 100) : 0;
  const budgetRatio = budgetDisplay.isDifferentCurrency && activeBudget?.totalBudget > 0
    ? (budgetDisplay.displayAmount / activeBudget.totalBudget)
    : 1;

  // Category spending lookup table
  const categorySpentMap = {};
  (categoryBreakdown?.categories || []).forEach((c) => {
    categorySpentMap[c.category] = c.total;
  });

  const sumOfAllocations = Object.values(categoryAllocations).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Monthly Budgets</h2>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            Set spending limits per category to keep your hostel and student expenses controlled.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-dark-850 border border-dark-750 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-750 transition-colors"
              title="Previous Month"
            >
              <FiChevronLeft className="text-base" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-750 transition-colors"
              title="Next Month"
            >
              <FiChevronRight className="text-base" />
            </button>
          </div>

          {(selectedMonth !== today.getMonth() + 1 || selectedYear !== today.getFullYear()) && (
            <Button variant="ghost" size="sm" onClick={handleCurrentMonth}>
              Today
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={activeBudget ? FiEdit2 : FiPlus}
            onClick={handleOpenModal}
          >
            {activeBudget ? 'Edit Budget' : 'Set Budget'}
          </Button>
        </div>
      </div>

      {loading && !activeBudget ? (
        <div className="py-20 text-center">
          <LoadingSpinner size="lg" message="Loading budget allocations..." />
        </div>
      ) : !activeBudget ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={FiPieChart}
              title={`No Budget Set for ${monthNames[selectedMonth - 1]} ${selectedYear}`}
              description="Setting a monthly spending limit helps calculate your daily safe limits, pace warnings, and runout projections."
              action={
                <Button variant="primary" icon={FiPlus} onClick={handleOpenModal}>
                  Set Budget for {monthNames[selectedMonth - 1]}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Budget Overview Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Overall Monthly Allocation</CardTitle>
                <CardDescription>
                  {monthNames[selectedMonth - 1]} {selectedYear} • Actual spent vs monthly ceiling
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    overallPercentage > 100 ? 'danger' : overallPercentage > 80 ? 'warning' : 'success'
                  }
                >
                  {overallPercentage > 100
                    ? 'OVER BUDGET'
                    : overallPercentage > 80
                    ? 'NEAR LIMIT'
                    : 'ON TRACK'}
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-expense-400 hover:bg-dark-700/50 transition-colors"
                  title="Delete budget"
                >
                  <FiTrash2 className="text-base" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                  <span className="text-xs text-dark-400 font-medium">Total Monthly Budget</span>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {budgetDisplay.primaryText}
                  </p>
                  {budgetDisplay.secondaryText && (
                    <span className="block text-xs text-dark-400 mt-0.5">
                      {budgetDisplay.secondaryText}
                    </span>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                  <span className="text-xs text-dark-400 font-medium">Total Spent So Far</span>
                  <p className="text-xl sm:text-2xl font-bold text-expense-400 mt-1">
                    {formatCurrency(totalSpent, currencyCode)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-750">
                  <span className="text-xs text-dark-400 font-medium">Remaining Budget</span>
                  <p className={`text-xl sm:text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-expense-400' : 'text-income-400'}`}>
                    {formatCurrency(remainingBudget, currencyCode)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dark-300">Budget Consumed</span>
                  <span className={overallPercentage > 100 ? 'text-expense-400' : 'text-white'}>
                    {overallPercentage}%
                  </span>
                </div>
                <ProgressBar
                  value={overallPercentage}
                  max={100}
                  color={overallPercentage > 100 ? 'rose' : overallPercentage > 80 ? 'amber' : 'emerald'}
                  size="md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Budgets Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Category Allocations</h3>
              <span className="text-xs text-dark-400">
                {(activeBudget.categoryBudgets || []).length} categories with specific limits
              </span>
            </div>

            {activeBudget.categoryBudgets && activeBudget.categoryBudgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBudget.categoryBudgets.map((cb) => {
                  const spent = categorySpentMap[cb.category] || 0;
                  const limit = cb.displayAmount !== undefined ? cb.displayAmount : (cb.amount * budgetRatio);
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const remaining = limit - spent;
                  const isOver = pct > 100;
                  const isCaution = pct >= 80 && !isOver;

                  return (
                    <Card key={cb.category} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{cb.category}</span>
                        <Badge variant={isOver ? 'danger' : isCaution ? 'warning' : 'success'} size="sm">
                          {isOver ? 'Over Budget' : isCaution ? 'Caution' : 'Good'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-400">
                          Spent: <strong className="text-white">{formatCurrency(spent, currencyCode)}</strong>
                        </span>
                        <span className="text-dark-400">
                          Limit: <strong className="text-white">
                            {formatCurrency(limit, budgetDisplay.displayCurrency)}
                            {budgetDisplay.isDifferentCurrency && (
                              <span className="text-dark-400 ml-1 font-normal">
                                (orig. {formatCurrency(cb.amount, budgetDisplay.originalCurrency)})
                              </span>
                            )}
                          </strong>
                        </span>
                      </div>

                      <ProgressBar
                        value={pct}
                        max={100}
                        color={isOver ? 'rose' : isCaution ? 'amber' : 'emerald'}
                        size="sm"
                      />

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-dark-750/50">
                        <span className="text-dark-400">Remaining</span>
                        <span className={remaining < 0 ? 'text-expense-400 font-bold' : 'text-income-400 font-medium'}>
                          {remaining < 0 ? `Over by ${formatCurrency(Math.abs(remaining), currencyCode)}` : formatCurrency(remaining, currencyCode)}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-dark-400">
                  <FiAlertTriangle className="text-2xl text-warning-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white mb-1">No category limits defined yet</p>
                  <p className="text-xs text-dark-400 max-w-sm mx-auto mb-4">
                    You have an overall budget of {formatCurrency(totalBudgetAmount, currencyCode)}, but no specific limits for individual categories (Mess, Books, Travel).
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleOpenModal}>
                    Add Category Limits
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeBudget ? `Edit Budget (${monthNames[selectedMonth - 1]} ${selectedYear})` : `Set Budget (${monthNames[selectedMonth - 1]} ${selectedYear})`}
        description="Establish your total spending ceiling and category breakdown."
        size="lg"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Budget Currency"
              value={budgetCurrency}
              onChange={(e) => setBudgetCurrency(e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </Select>

            <Input
              label={`Total Monthly Budget (${getCurrencySymbol(budgetCurrency)})`}
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10000"
              icon={FiDollarSign}
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              required
              helperText="Spending ceiling for this month in budget currency"
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Category Specific Limits (Optional)</label>
              {sumOfAllocations > 0 && (
                <span className={`text-xs ${Number(budgetTotal) > 0 && sumOfAllocations > Number(budgetTotal) ? 'text-expense-400 font-semibold' : 'text-dark-400'}`}>
                  Sum: {getCurrencySymbol(budgetCurrency)}{sumOfAllocations.toFixed(0)} / {budgetTotal ? `${getCurrencySymbol(budgetCurrency)}${Number(budgetTotal).toFixed(0)}` : '--'}
                </span>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-dark-900 border border-dark-750">
              {expenseCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-dark-200 truncate flex items-center gap-1.5">
                    <span>{cat.icon || '🏷️'}</span>
                    <span>{cat.name}</span>
                  </span>
                  <div className="w-36">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="No limit"
                      className="input py-1 px-2.5 text-xs text-right bg-dark-800"
                      value={categoryAllocations[cat.name] || ''}
                      onChange={(e) => handleAllocationChange(cat.name, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Monthly Budget"
        message={`Are you sure you want to delete the budget for ${monthNames[selectedMonth - 1]} ${selectedYear}?`}
        confirmText="Delete Budget"
        isDestructive={true}
      />
    </div>
  );
};

export default BudgetsPage;
