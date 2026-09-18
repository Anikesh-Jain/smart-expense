const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');
const {
  convertCurrency,
  getExchangeRates,
  BASELINE_RATES,
  getCurrencySymbol,
  roundCurrency
} = require('../utils/currencyService');

/**
 * Helper to get active rates and display currency for a user.
 */
async function getRatesAndDisplayCurrency(user) {
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
 * Decorate a goal object with display currency conversions without mutating stored database values.
 */
function decorateGoalWithDisplay(goal, displayCurrency, rates) {
  const goalObj = goal && goal.toObject ? goal.toObject() : { ...goal };
  const goalCur = (goalObj.currency || 'INR').toUpperCase().trim();
  const currentAmount = Number(goalObj.currentAmount) || 0;
  const targetAmount = Number(goalObj.targetAmount) || 0;

  const currentAmountInDisplayCurrency = roundCurrency(
    convertCurrency(currentAmount, goalCur, displayCurrency, rates),
    displayCurrency
  );
  const targetAmountInDisplayCurrency = roundCurrency(
    convertCurrency(targetAmount, goalCur, displayCurrency, rates),
    displayCurrency
  );

  return {
    ...goalObj,
    displayCurrency,
    currentAmountInDisplayCurrency,
    targetAmountInDisplayCurrency
  };
}

// @desc    Get all savings goals for current user
// @route   GET /api/savings-goals
// @access  Private
const getSavingsGoals = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { user: req.user._id };
    if (status && ['active', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const goals = await SavingsGoal.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);

    let totalSavedInDisplayCurrency = 0;
    const goalsWithDisplay = goals.map(g => {
      const decorated = decorateGoalWithDisplay(g, displayCurrency, rates);
      totalSavedInDisplayCurrency += decorated.currentAmountInDisplayCurrency;
      return decorated;
    });

    totalSavedInDisplayCurrency = roundCurrency(totalSavedInDisplayCurrency, displayCurrency);

    res.status(200).json({
      success: true,
      count: goalsWithDisplay.length,
      data: goalsWithDisplay,
      summary: {
        totalSavedInDisplayCurrency,
        displayCurrency,
        activeGoalsCount: goals.filter(g => g.status !== 'completed').length,
        completedGoalsCount: goals.filter(g => g.status === 'completed').length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single savings goal by ID
// @route   GET /api/savings-goals/:id
// @access  Private
const getSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);

    res.status(200).json({
      success: true,
      data: decorateGoalWithDisplay(goal, displayCurrency, rates)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new savings goal
// @route   POST /api/savings-goals
// @access  Private
const createSavingsGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, currentAmount = 0, targetDate, description, currency } = req.body;

    // Determine goal currency: use provided or fall back to user's current currency
    let goalCurrency = currency;
    if (!goalCurrency) {
      const user = await User.findById(req.user._id).lean();
      goalCurrency = (user && user.currency) || 'INR';
    }
    goalCurrency = goalCurrency.toUpperCase().trim();

    const target = Number(targetAmount);
    const current = Number(currentAmount);

    const status = current >= target ? 'completed' : 'active';

    const goal = await SavingsGoal.create({
      user: req.user._id,
      title: title.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      description: description ? description.trim() : '',
      status,
      currency: goalCurrency
    });

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: decorateGoalWithDisplay(goal, displayCurrency, rates)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings-goals/:id
// @access  Private
const updateSavingsGoal = async (req, res, next) => {
  try {
    let goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    const { title, targetAmount, currentAmount, targetDate, description, status } = req.body;

    if (title !== undefined) goal.title = title.trim();
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount);
    if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : undefined;
    if (description !== undefined) goal.description = description.trim();

    // Auto status completion check if not explicitly set
    if (status !== undefined) {
      goal.status = status;
    } else if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    } else if (goal.currentAmount < goal.targetAmount && goal.status === 'completed') {
      goal.status = 'active';
    }

    await goal.save();

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user);

    res.status(200).json({
      success: true,
      data: decorateGoalWithDisplay(goal, displayCurrency, rates)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings-goals/:id
// @access  Private
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add contribution to a savings goal
// @route   PUT /api/savings-goals/:id/contribute
// @access  Private
const contributeToGoal = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    const contributionAmount = Number(amount);

    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Contribution amount must be greater than 0'
      });
    }

    let goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    // Determine contribution currency: provided, or goal currency, or user currency
    let contribCurrency = currency;
    if (!contribCurrency) {
      contribCurrency = goal.currency || 'INR';
    }
    contribCurrency = contribCurrency.toUpperCase().trim();

    const goalCurrency = (goal.currency || 'INR').toUpperCase();

    // Get live rates and snapshot them
    let rates, rateProvider;
    try {
      const rateData = await getExchangeRates();
      rates = rateData.rates || BASELINE_RATES;
      rateProvider = rateData.provider || 'fallback';
    } catch {
      rates = BASELINE_RATES;
      rateProvider = 'fallback';
    }

    // Convert contribution to goal currency
    let convertedAmount;
    let exchangeRate;
    if (contribCurrency === goalCurrency) {
      convertedAmount = contributionAmount;
      exchangeRate = 1.0;
    } else {
      convertedAmount = convertCurrency(contributionAmount, contribCurrency, goalCurrency, rates);
      // exchangeRate = how many units of contribCurrency per 1 unit of goalCurrency
      const goalRateToUSD = rates[goalCurrency] || BASELINE_RATES[goalCurrency] || 1.0;
      const contribRateToUSD = rates[contribCurrency] || BASELINE_RATES[contribCurrency] || 1.0;
      exchangeRate = contribRateToUSD / goalRateToUSD;
    }

    // Record contribution snapshot — immutable once stored
    const contributionRecord = {
      amount: contributionAmount,
      currency: contribCurrency,
      convertedAmountToGoalCurrency: convertedAmount,
      exchangeRate,
      rateTimestamp: new Date(),
      rateProvider,
      date: new Date()
    };

    goal.contributions.push(contributionRecord);
    goal.currentAmount = (goal.currentAmount || 0) + convertedAmount;

    // Automatically mark completed if reached or exceeded target
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    }

    await goal.save();

    const sym = getCurrencySymbol(contribCurrency);
    const displayCurrency = (req.user && req.user.currency) || 'INR';

    res.status(200).json({
      success: true,
      message: `Contributed ${sym}${contributionAmount} successfully`,
      data: decorateGoalWithDisplay(goal, displayCurrency, rates)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToGoal
};
