const Budget = require('../models/Budget');
const User = require('../models/User');
const { convertCurrency, getExchangeRates, BASELINE_RATES, roundCurrency } = require('../utils/currencyService');

/**
 * Compute baseBudgetUSD for a given totalBudget + currency.
 */
async function computeBudgetUSD(totalBudget, currency) {
  let rates;
  try {
    const rateData = await getExchangeRates();
    rates = rateData.rates || BASELINE_RATES;
  } catch {
    rates = BASELINE_RATES;
  }
  return convertCurrency(totalBudget, currency || 'INR', 'USD', rates);
}

/**
 * Helper to get active rates and display currency for a user.
 */
async function getRatesAndDisplayCurrency(user, overrideCurrency = null) {
  let rates;
  try {
    const rateData = await getExchangeRates();
    rates = rateData.rates || BASELINE_RATES;
  } catch {
    rates = BASELINE_RATES;
  }
  const displayCurrency = (overrideCurrency || (user && user.currency) || 'INR').toUpperCase().trim();
  return { rates, displayCurrency };
}

/**
 * Decorate a budget object with display currency conversions without mutating stored database values.
 */
function decorateBudgetWithDisplay(budget, displayCurrency, rates) {
  if (!budget) return null;
  const bObj = budget && budget.toObject ? budget.toObject() : { ...budget };
  const bCur = (bObj.currency || 'INR').toUpperCase().trim();
  const numBudget = Number(bObj.totalBudget) || 0;
  const targetCur = (displayCurrency || 'INR').toUpperCase().trim();

  let displayTotalBudget;
  if (bCur === targetCur) {
    displayTotalBudget = numBudget;
  } else if (targetCur === 'USD' && bObj.baseBudgetUSD !== undefined && bObj.baseBudgetUSD !== null) {
    displayTotalBudget = Number(bObj.baseBudgetUSD);
  } else {
    displayTotalBudget = roundCurrency(
      convertCurrency(numBudget, bCur, targetCur, rates),
      targetCur
    );
  }

  return {
    ...bObj,
    displayTotalBudget,
    displayCurrency: targetCur
  };
}

// @desc    Get all budgets for current user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);

    const budgets = await Budget.find({ user: req.user._id })
      .sort({ year: -1, month: -1 })
      .lean();

    const decoratedBudgets = budgets.map((b) =>
      decorateBudgetWithDisplay(b, displayCurrency, rates)
    );

    res.status(200).json({
      success: true,
      count: decoratedBudgets.length,
      data: decoratedBudgets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current month's budget
// @route   GET /api/budgets/current
// @access  Private
const getCurrentBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year
    }).lean();

    if (!budget) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No budget found for the current month'
      });
    }

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);
    const decorated = decorateBudgetWithDisplay(budget, displayCurrency, rates);

    res.status(200).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update budget for a given month and year
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  try {
    const { month, year, totalBudget, categoryBudgets, currency } = req.body;

    // Determine budget currency: use provided or fall back to user's current currency
    let budgetCurrency = currency;
    if (!budgetCurrency) {
      const user = await User.findById(req.user._id).lean();
      budgetCurrency = (user && user.currency) || 'INR';
    }
    budgetCurrency = budgetCurrency.toUpperCase().trim();

    const numBudget = Number(totalBudget);

    // Check if budget already exists for this month/year
    let budget = await Budget.findOne({
      user: req.user._id,
      month: Number(month),
      year: Number(year)
    });

    if (budget) {
      // Update existing budget — preserve currency if not changing
      budget.totalBudget = numBudget;
      if (currency !== undefined) {
        budget.currency = budgetCurrency;
      }
      if (categoryBudgets !== undefined) {
        budget.categoryBudgets = categoryBudgets;
      }
      // Recalculate baseBudgetUSD
      budget.baseBudgetUSD = await computeBudgetUSD(numBudget, budget.currency || budgetCurrency);
      await budget.save();

      const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);
      const decorated = decorateBudgetWithDisplay(budget, displayCurrency, rates);

      return res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: decorated
      });
    }

    // Compute baseBudgetUSD before creation
    const baseBudgetUSD = await computeBudgetUSD(numBudget, budgetCurrency);

    // Create new budget
    budget = await Budget.create({
      user: req.user._id,
      month: Number(month),
      year: Number(year),
      totalBudget: numBudget,
      currency: budgetCurrency,
      baseBudgetUSD,
      categoryBudgets: categoryBudgets || []
    });

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);
    const decorated = decorateBudgetWithDisplay(budget, displayCurrency, rates);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget by ID
// @route   GET /api/budgets/:id
// @access  Private
const getBudgetById = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);
    const decorated = decorateBudgetWithDisplay(budget, displayCurrency, rates);

    res.status(200).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget by ID
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const { month, year, totalBudget, categoryBudgets, currency } = req.body;

    // If month/year is changing, check for collision
    if (
      (month !== undefined && month !== budget.month) ||
      (year !== undefined && year !== budget.year)
    ) {
      const targetMonth = month !== undefined ? Number(month) : budget.month;
      const targetYear = year !== undefined ? Number(year) : budget.year;

      const existing = await Budget.findOne({
        user: req.user._id,
        month: targetMonth,
        year: targetYear,
        _id: { $ne: budget._id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A budget already exists for ${targetMonth}/${targetYear}`
        });
      }

      budget.month = targetMonth;
      budget.year = targetYear;
    }

    if (totalBudget !== undefined) budget.totalBudget = Number(totalBudget);
    if (categoryBudgets !== undefined) budget.categoryBudgets = categoryBudgets;
    if (currency !== undefined) budget.currency = currency.toUpperCase().trim();

    // Recalculate baseBudgetUSD whenever totalBudget or currency changes
    if (totalBudget !== undefined || currency !== undefined) {
      budget.baseBudgetUSD = await computeBudgetUSD(budget.totalBudget, budget.currency || 'INR');
    }

    await budget.save();

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);
    const decorated = decorateBudgetWithDisplay(budget, displayCurrency, rates);

    res.status(200).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  getCurrentBudget,
  createBudget,
  getBudgetById,
  updateBudget,
  deleteBudget
};
