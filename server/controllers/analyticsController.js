const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');
const {
  round2,
  getMonthProgress,
  calculateSpendingPace,
  calculateWillMoneyLast,
  calculateFinancialHealthScore,
  generateSmartSuggestions,
  generateSmartSavingPlan
} = require('../utils/financialCalculations');
const { convertCurrency, getExchangeRates, BASELINE_RATES } = require('../utils/currencyService');

/**
 * Get current exchange rates (or fallback) and the user's display currency.
 * Returns { rates, displayCurrency }.
 */
async function getRatesAndCurrency(user) {
  let rates;
  try {
    const rateData = await getExchangeRates();
    rates = rateData.rates || BASELINE_RATES;
  } catch {
    rates = BASELINE_RATES;
  }
  const displayCurrency = (user && user.currency) || 'INR';
  return { rates, displayCurrency };
}

/**
 * Convert a USD-normalized amount to the user's display currency.
 */
function usdToDisplay(amountUSD, displayCurrency, rates) {
  return convertCurrency(amountUSD, 'USD', displayCurrency, rates);
}

/**
 * Helper to compute user baseline financial figures converted to display currency.
 * Baseline figures are configured in user.profileBaseCurrency (default 'INR').
 */
function getBaselineFinancials(user, displayCurrency, rates) {
  const profileBaseCurrency = (user && user.profileBaseCurrency) || 'INR';
  const rawIncome = Number(user && user.monthlyIncome) || 0;
  const rawFixed = Number(user && user.fixedExpenses) || 0;
  const rawSavings = Number(user && user.savingsTarget) || 0;

  const baselineIncome = round2(convertCurrency(rawIncome, profileBaseCurrency, displayCurrency, rates));
  const baselineFixedExpenses = round2(convertCurrency(rawFixed, profileBaseCurrency, displayCurrency, rates));
  const baselineSavingsTarget = round2(convertCurrency(rawSavings, profileBaseCurrency, displayCurrency, rates));
  const baselineObligations = round2(baselineFixedExpenses + baselineSavingsTarget);
  const baselineBalance = round2(baselineIncome - baselineObligations);

  return {
    baselineIncome,
    baselineFixedExpenses,
    baselineSavingsTarget,
    baselineObligations,
    baselineBalance
  };
}

// Helper to get month boundaries in UTC/Local safely
const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
};

// @desc    Get dashboard overview data
// @route   GET /api/analytics/overview
// @access  Private
const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const { start: monthStart, end: monthEnd } = getMonthRange(currentYear, currentMonth);
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const {
      baselineIncome,
      baselineFixedExpenses,
      baselineSavingsTarget,
      baselineObligations
    } = getBaselineFinancials(req.user, displayCurrency, rates);

    // 1. All-time income & expense aggregation — sum baseAmountUSD for correct multi-currency totals
    const allTimeAgg = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$baseAmountUSD' }
        }
      }
    ]);

    let totalIncomeUSD = 0;
    let totalExpensesUSD = 0;
    allTimeAgg.forEach(item => {
      if (item._id === 'income') totalIncomeUSD = item.total || 0;
      if (item._id === 'expense') totalExpensesUSD = item.total || 0;
    });

    const totalIncome = round2(baselineIncome + usdToDisplay(totalIncomeUSD, displayCurrency, rates));
    const totalExpenses = round2(baselineObligations + usdToDisplay(totalExpensesUSD, displayCurrency, rates));
    const currentBalance = round2(totalIncome - totalExpenses);

    // 2. Current month income & expense
    const monthAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$baseAmountUSD' }
        }
      }
    ]);

    let monthlyIncomeUSD = 0;
    let monthlyExpensesUSD = 0;
    monthAgg.forEach(item => {
      if (item._id === 'income') monthlyIncomeUSD = item.total || 0;
      if (item._id === 'expense') monthlyExpensesUSD = item.total || 0;
    });

    const monthlyIncome = round2(baselineIncome + usdToDisplay(monthlyIncomeUSD, displayCurrency, rates));
    const monthlyExpenses = round2(usdToDisplay(monthlyExpensesUSD, displayCurrency, rates));

    // 3. Recent 5 transactions (decorated with display currency fields)
    const rawRecentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .lean();

    const recentTransactions = rawRecentTransactions.map((tx) => {
      const txCur = (tx.currency || 'INR').toUpperCase().trim();
      const numAmount = Number(tx.amount) || 0;
      let displayAmount;
      if (txCur === displayCurrency) {
        displayAmount = numAmount;
      } else if (displayCurrency === 'USD' && tx.baseAmountUSD !== undefined && tx.baseAmountUSD !== null) {
        displayAmount = Number(tx.baseAmountUSD);
      } else {
        displayAmount = round2(convertCurrency(numAmount, txCur, displayCurrency, rates));
      }
      return {
        ...tx,
        displayAmount,
        displayCurrency
      };
    });

    // 4. Current month category summaries — aggregate in USD, present in display currency
    const categorySummaries = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          totalUSD: { $sum: '$baseAmountUSD' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalUSD: -1 } }
    ]);

    const formattedCategorySummaries = categorySummaries.map(c => {
      const total = round2(usdToDisplay(c.totalUSD || 0, displayCurrency, rates));
      return {
        category: c._id,
        total,
        count: c.count,
        percentage: monthlyExpenses > 0 ? round2((total / monthlyExpenses) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        recentTransactions,
        categorySummaries: formattedCategorySummaries,
        userProfile: {
          monthlyIncome: baselineIncome,
          fixedExpenses: baselineFixedExpenses,
          savingsTarget: baselineSavingsTarget,
          currency: displayCurrency
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends for Recharts
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthlyTrends = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const monthsLimit = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 6));
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);

    // Calculate start date: N months ago
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsLimit + 1, 1);

    const trendsAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalUSD: { $sum: '$baseAmountUSD' }
        }
      }
    ]);

    // Build ordered list of the last N months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const results = [];

    for (let i = monthsLimit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${monthNames[m - 1]} ${y}`;

      const incMatch = trendsAgg.find(t => t._id.year === y && t._id.month === m && t._id.type === 'income');
      const expMatch = trendsAgg.find(t => t._id.year === y && t._id.month === m && t._id.type === 'expense');

      const income = incMatch ? round2(usdToDisplay(incMatch.totalUSD || 0, displayCurrency, rates)) : 0;
      const expenses = expMatch ? round2(usdToDisplay(expMatch.totalUSD || 0, displayCurrency, rates)) : 0;
      const netSavings = round2(income - expenses);

      results.push({
        label,
        monthKey,
        year: y,
        month: m,
        income,
        expenses,
        netSavings
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breakdown with percentages
// @route   GET /api/analytics/categories
// @access  Private
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const type = req.query.type === 'income' ? 'income' : 'expense';
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);

    const { start, end } = getMonthRange(year, month);

    const breakdownAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$category',
          totalUSD: { $sum: '$baseAmountUSD' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalUSD: -1 } }
    ]);

    const categories = breakdownAgg.map(item => ({
      category: item._id,
      total: round2(usdToDisplay(item.totalUSD || 0, displayCurrency, rates)),
      count: item.count
    }));

    const grandTotal = round2(categories.reduce((sum, item) => sum + item.total, 0));

    categories.forEach(item => {
      item.percentage = grandTotal > 0 ? round2((item.total / grandTotal) * 100) : 0;
    });

    const topCategories = categories.slice(0, 3);

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        type,
        grandTotal,
        categories,
        topCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending pace analysis
// @route   GET /api/analytics/spending-pace
// @access  Private
const getSpendingPace = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { start, end } = getMonthRange(currentYear, currentMonth);
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const { baselineIncome, baselineBalance } = getBaselineFinancials(req.user, displayCurrency, rates);

    // Parallel fetch: current month expenses, all-time balance, active budget
    const [spentAgg, allTimeAgg, budget] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Budget.findOne({ user: userId, month: currentMonth, year: currentYear }).lean()
    ]);

    const totalSpentThisMonth = round2(usdToDisplay(
      spentAgg.length > 0 ? (spentAgg[0].totalUSD || 0) : 0,
      displayCurrency, rates
    ));

    let totalIncUSD = 0;
    let totalExpUSD = 0;
    allTimeAgg.forEach(i => {
      if (i._id === 'income') totalIncUSD = i.totalUSD || 0;
      if (i._id === 'expense') totalExpUSD = i.totalUSD || 0;
    });
    const transactionBalance = usdToDisplay(totalIncUSD - totalExpUSD, displayCurrency, rates);
    const currentBalance = round2(baselineBalance + transactionBalance);

    // Convert budget to display currency if needed
    let displayBudget = null;
    if (budget) {
      const budgetCur = budget.currency || 'INR';
      if (budgetCur === displayCurrency) {
        displayBudget = budget.totalBudget;
      } else {
        // Convert via USD: use baseBudgetUSD if available
        const budgetUSD = budget.baseBudgetUSD || convertCurrency(budget.totalBudget, budgetCur, 'USD', rates);
        displayBudget = round2(usdToDisplay(budgetUSD, displayCurrency, rates));
      }
    }

    const pace = calculateSpendingPace({
      totalSpentThisMonth,
      currentBalance,
      totalBudget: displayBudget,
      monthlyIncome: baselineIncome,
      referenceDate: now,
      currency: displayCurrency
    });

    res.status(200).json({
      success: true,
      data: {
        ...pace,
        activeBudget: displayBudget
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Will my money last projection
// @route   GET /api/analytics/money-last
// @access  Private
const getWillMoneyLast = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { start, end } = getMonthRange(currentYear, currentMonth);
    const { daysElapsed, daysRemaining } = getMonthProgress(now);
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const { baselineBalance } = getBaselineFinancials(req.user, displayCurrency, rates);

    const [spentAgg, allTimeAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', totalUSD: { $sum: '$baseAmountUSD' } } }
      ])
    ]);

    const totalSpentThisMonth = round2(usdToDisplay(
      spentAgg.length > 0 ? (spentAgg[0].totalUSD || 0) : 0,
      displayCurrency, rates
    ));

    let totalIncUSD = 0;
    let totalExpUSD = 0;
    allTimeAgg.forEach(i => {
      if (i._id === 'income') totalIncUSD = i.totalUSD || 0;
      if (i._id === 'expense') totalExpUSD = i.totalUSD || 0;
    });
    const transactionBalance = usdToDisplay(totalIncUSD - totalExpUSD, displayCurrency, rates);
    const currentBalance = round2(baselineBalance + transactionBalance);

    const projection = calculateWillMoneyLast({
      currentBalance,
      totalSpentThisMonth,
      daysElapsed,
      daysRemaining,
      referenceDate: now,
      currency: displayCurrency
    });

    res.status(200).json({
      success: true,
      data: projection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Financial health score (0-100 explainable)
// @route   GET /api/analytics/financial-health
// @access  Private
const getFinancialHealthScore = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { start, end } = getMonthRange(currentYear, currentMonth);
    const { daysElapsed, daysInMonth } = getMonthProgress(now);
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const {
      baselineIncome,
      baselineSavingsTarget,
      baselineBalance
    } = getBaselineFinancials(req.user, displayCurrency, rates);

    const [spentAgg, allTimeAgg, budget, savingsGoals, dailyAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Budget.findOne({ user: userId, month: currentMonth, year: currentYear }).lean(),
      SavingsGoal.find({ user: userId }).lean(),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$date' },
            dailyTotalUSD: { $sum: '$baseAmountUSD' }
          }
        }
      ])
    ]);

    const totalSpentThisMonth = round2(usdToDisplay(
      spentAgg.length > 0 ? (spentAgg[0].totalUSD || 0) : 0,
      displayCurrency, rates
    ));

    let totalIncUSD = 0;
    let totalExpUSD = 0;
    allTimeAgg.forEach(i => {
      if (i._id === 'income') totalIncUSD = i.totalUSD || 0;
      if (i._id === 'expense') totalExpUSD = i.totalUSD || 0;
    });
    const transactionBalance = usdToDisplay(totalIncUSD - totalExpUSD, displayCurrency, rates);
    const currentBalance = round2(baselineBalance + transactionBalance);

    const dailySpendings = dailyAgg.map(d =>
      round2(usdToDisplay(d.dailyTotalUSD || 0, displayCurrency, rates))
    );

    // Convert budget to display currency if needed
    let displayBudget = null;
    if (budget) {
      const budgetCur = budget.currency || 'INR';
      if (budgetCur === displayCurrency) {
        displayBudget = budget.totalBudget;
      } else {
        const budgetUSD = budget.baseBudgetUSD || convertCurrency(budget.totalBudget, budgetCur, 'USD', rates);
        displayBudget = round2(usdToDisplay(budgetUSD, displayCurrency, rates));
      }
    }

    const convertedSavingsGoals = savingsGoals.map(g => {
      const goalCur = (g.currency || 'INR').toUpperCase();
      return {
        ...g,
        currentAmount: convertCurrency(g.currentAmount || 0, goalCur, displayCurrency, rates),
        targetAmount: convertCurrency(g.targetAmount || 0, goalCur, displayCurrency, rates),
        currency: displayCurrency
      };
    });

    const health = calculateFinancialHealthScore({
      totalBudget: displayBudget,
      totalSpentThisMonth,
      currentBalance,
      monthlyIncome: baselineIncome,
      savingsTarget: baselineSavingsTarget,
      savingsGoals: convertedSavingsGoals,
      dailySpendings,
      daysElapsed,
      daysInMonth,
      currency: displayCurrency
    });

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Smart financial suggestions based on actual user spending
// @route   GET /api/analytics/suggestions
// @access  Private
const getSmartSuggestions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { start, end } = getMonthRange(currentYear, currentMonth);
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const { baselineIncome, baselineBalance } = getBaselineFinancials(req.user, displayCurrency, rates);

    // First week of month: day 1 to day 7
    const firstWeekEnd = new Date(Date.UTC(currentYear, currentMonth - 1, 7, 23, 59, 59, 999));

    const [categoryAgg, spentAgg, allTimeAgg, firstWeekAgg, budget] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$category',
            totalUSD: { $sum: '$baseAmountUSD' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: start, $lte: firstWeekEnd }
          }
        },
        { $group: { _id: null, totalUSD: { $sum: '$baseAmountUSD' } } }
      ]),
      Budget.findOne({ user: userId, month: currentMonth, year: currentYear }).lean()
    ]);

    const totalSpentThisMonth = round2(usdToDisplay(
      spentAgg.length > 0 ? (spentAgg[0].totalUSD || 0) : 0,
      displayCurrency, rates
    ));
    const firstWeekSpend = round2(usdToDisplay(
      firstWeekAgg.length > 0 ? (firstWeekAgg[0].totalUSD || 0) : 0,
      displayCurrency, rates
    ));

    let totalIncUSD = 0;
    let totalExpUSD = 0;
    allTimeAgg.forEach(i => {
      if (i._id === 'income') totalIncUSD = i.totalUSD || 0;
      if (i._id === 'expense') totalExpUSD = i.totalUSD || 0;
    });
    const transactionBalance = usdToDisplay(totalIncUSD - totalExpUSD, displayCurrency, rates);
    const currentBalance = round2(baselineBalance + transactionBalance);

    const categoryTotals = categoryAgg.map(c => ({
      category: c._id,
      total: round2(usdToDisplay(c.totalUSD || 0, displayCurrency, rates))
    }));

    // Convert budget to display currency if needed
    let displayBudget = null;
    if (budget) {
      const budgetCur = budget.currency || 'INR';
      if (budgetCur === displayCurrency) {
        displayBudget = budget.totalBudget;
      } else {
        const budgetUSD = budget.baseBudgetUSD || convertCurrency(budget.totalBudget, budgetCur, 'USD', rates);
        displayBudget = round2(usdToDisplay(budgetUSD, displayCurrency, rates));
      }
    }

    const spendingPace = calculateSpendingPace({
      totalSpentThisMonth,
      currentBalance,
      totalBudget: displayBudget,
      monthlyIncome: baselineIncome,
      referenceDate: now,
      currency: displayCurrency
    });

    const suggestions = generateSmartSuggestions({
      categoryTotals,
      totalSpentThisMonth,
      currentBalance,
      monthlyIncome: baselineIncome,
      currentBudget: budget,
      spendingPace,
      firstWeekSpend,
      currency: displayCurrency
    });

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a smart saving plan
// @route   POST /api/analytics/saving-plan
// @access  Private
const postSmartSavingPlan = async (req, res, next) => {
  try {
    const { targetAmount, targetDate } = req.body;
    const userId = req.user._id;
    const { rates, displayCurrency } = await getRatesAndCurrency(req.user);
    const { baselineIncome, baselineFixedExpenses } = getBaselineFinancials(req.user, displayCurrency, rates);

    // Fetch user recent category spending for realistic suggestions
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { start, end } = getMonthRange(currentYear, currentMonth);

    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$category',
          totalUSD: { $sum: '$baseAmountUSD' }
        }
      }
    ]);

    const categorySpendings = categoryAgg.map(c => ({
      category: c._id,
      total: round2(usdToDisplay(c.totalUSD || 0, displayCurrency, rates))
    }));

    let plan;
    try {
      plan = generateSmartSavingPlan({
        targetAmount,
        targetDate,
        monthlyIncome: baselineIncome,
        fixedExpenses: baselineFixedExpenses,
        categorySpendings,
        referenceDate: now,
        currency: displayCurrency
      });
    } catch (calcError) {
      return res.status(400).json({
        success: false,
        message: calcError.message
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getMonthlyTrends,
  getCategoryBreakdown,
  getSpendingPace,
  getWillMoneyLast,
  getFinancialHealthScore,
  getSmartSuggestions,
  postSmartSavingPlan
};
