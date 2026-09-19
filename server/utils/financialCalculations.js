/**
 * Financial Intelligence Calculations Engine
 * 
 * Deterministic mathematical and financial logic for:
 * - Spending Pace Analysis
 * - "Will My Money Last?" Projections
 * - Financial Health Score (0-100 explainable)
 * - Smart Financial Suggestions
 * - Smart Saving Plan & Feasibility
 * 
 * Safe handling of:
 * - Zero income / zero expenses
 * - Zero days remaining (end of month)
 * - Negative balance
 * - No transaction history
 * - Infeasible targets
 * - Never returns NaN, Infinity, or undefined
 */

/**
 * Currency symbol lookup — delegates to the single source of truth.
 */
const { getCurrencySymbol } = require('./currencyService');
const getSymbol = (currency = 'INR') => getCurrencySymbol(currency);

/**
 * Helper to round to 2 decimal places safely
 */
const round2 = (num) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Get days in month, days elapsed, and days remaining for a given date
 */
const getMonthProgress = (referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = date.getDate();

  const daysElapsed = Math.max(1, currentDay);
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  return {
    year,
    month: month + 1, // 1-12
    daysInMonth,
    currentDay,
    daysElapsed,
    daysRemaining
  };
};

/**
 * 1. Calculate Spending Pace
 */
const calculateSpendingPace = ({
  totalSpentThisMonth = 0,
  currentBalance = 0,
  totalBudget = null,
  monthlyIncome = 0,
  referenceDate = new Date(),
  currency = 'INR'
}) => {
  const { daysInMonth, daysElapsed, daysRemaining } = getMonthProgress(referenceDate);
  const sym = getSymbol(currency);

  const spent = Math.max(0, Number(totalSpentThisMonth) || 0);
  const balance = Number(currentBalance) || 0;
  const income = Math.max(0, Number(monthlyIncome) || 0);

  // Average daily spending so far
  const avgDailySpending = round2(spent / daysElapsed);

  // Projected spending by end of month at current pace
  const projectedMonthlySpending = round2(avgDailySpending * daysInMonth);

  // Safe limits for remaining days
  let safeDailyLimit = 0;
  let safeWeeklyLimit = 0;

  if (balance > 0) {
    if (daysRemaining > 0) {
      safeDailyLimit = round2(balance / daysRemaining);
      safeWeeklyLimit = round2(safeDailyLimit * Math.min(7, daysRemaining));
    } else {
      // Last day of month: entire remaining balance is available for today
      safeDailyLimit = round2(balance);
      safeWeeklyLimit = round2(balance);
    }
  }

  // Projected end-of-month balance
  const projectedEndOfMonthBalance = round2(balance - (avgDailySpending * daysRemaining));

  // Determine pacing status: on_track | caution | overspending
  let status = 'on_track';
  let message = '';

  if (totalBudget && totalBudget > 0) {
    const budget = Number(totalBudget);
    if (projectedMonthlySpending > budget * 1.05 || balance < 0) {
      status = 'overspending';
      message = `At your current pace of ${sym}${avgDailySpending}/day, you are projected to exceed your monthly budget by ${sym}${round2(projectedMonthlySpending - budget)}.`;
    } else if (projectedMonthlySpending > budget * 0.9) {
      status = 'caution';
      message = `Your spending is close to your monthly budget limit (projected ${sym}${projectedMonthlySpending} of ${sym}${budget}).`;
    } else {
      status = 'on_track';
      message = `Great pace! Projected monthly spending of ${sym}${projectedMonthlySpending} is safely within your ${sym}${budget} budget.`;
    }
  } else if (income > 0) {
    if (projectedMonthlySpending > income || balance < 0) {
      status = 'overspending';
      message = `At your current pace of ${sym}${avgDailySpending}/day, you are projected to spend ${sym}${projectedMonthlySpending}, exceeding your income of ${sym}${income}.`;
    } else if (projectedMonthlySpending > income * 0.85) {
      status = 'caution';
      message = `Projected spending of ${sym}${projectedMonthlySpending} uses ${round2((projectedMonthlySpending / income) * 100)}% of your monthly income.`;
    } else {
      status = 'on_track';
      message = `Your spending is comfortably below your monthly income.`;
    }
  } else {
    if (balance < 0 || (avgDailySpending * daysRemaining > balance && balance > 0)) {
      status = 'overspending';
      message = `At ${sym}${avgDailySpending}/day, your remaining money will not cover the rest of the month.`;
    } else if (avgDailySpending * daysRemaining > balance * 0.8 && balance > 0) {
      status = 'caution';
      message = `Remaining balance is getting tight for the ${daysRemaining} days left.`;
    } else {
      status = 'on_track';
      message = `Spending pace is stable with your current balance.`;
    }
  }

  return {
    daysElapsed,
    daysRemaining,
    daysInMonth,
    totalSpentThisMonth: spent,
    averageDailySpending: avgDailySpending,
    projectedMonthlySpending,
    availableBalance: balance,
    safeDailyLimit,
    safeWeeklyLimit,
    projectedEndOfMonthBalance,
    status,
    message,
    currency
  };
};

/**
 * 2. Calculate Will My Money Last?
 */
const calculateWillMoneyLast = ({
  currentBalance = 0,
  totalSpentThisMonth = 0,
  daysElapsed = 1,
  daysRemaining = 0,
  referenceDate = new Date(),
  currency = 'INR'
}) => {
  const balance = Number(currentBalance) || 0;
  const spent = Math.max(0, Number(totalSpentThisMonth) || 0);
  const elapsed = Math.max(1, Number(daysElapsed) || 1);
  const remaining = Math.max(0, Number(daysRemaining) || 0);
  const date = new Date(referenceDate);
  const sym = getSymbol(currency);

  const avgDailySpending = round2(spent / elapsed);

  // Case 1: Negative or zero balance
  if (balance <= 0) {
    const todayStr = date.toISOString().split('T')[0];
    return {
      daysSupported: 0,
      daysRemaining: remaining,
      status: 'HIGH_RISK',
      shortfallDate: todayStr,
      averageDailySpending: avgDailySpending,
      availableBalance: balance,
      explanation: balance < 0
        ? `You currently have a negative balance (${sym}${balance}). Any new expense will increase your deficit.`
        : `Your balance is ${sym}0. You have no money remaining for the remaining ${remaining} days of the month.`,
      currency
    };
  }

  // Case 2: Zero daily spending so far (no expenses yet)
  if (avgDailySpending <= 0) {
    return {
      daysSupported: remaining > 0 ? remaining : 30,
      daysRemaining: remaining,
      status: 'SAFE',
      shortfallDate: null,
      averageDailySpending: 0,
      availableBalance: balance,
      explanation: `You have recorded no daily expenses this month. Your balance of ${sym}${balance} is 100% intact.`,
      currency
    };
  }

  // Case 3: Calculate days supported
  const daysSupported = Math.floor(balance / avgDailySpending);

  if (daysSupported >= remaining) {
    return {
      daysSupported,
      daysRemaining: remaining,
      status: 'SAFE',
      shortfallDate: null,
      averageDailySpending: avgDailySpending,
      availableBalance: balance,
      explanation: `At your current spending rate of ${sym}${avgDailySpending}/day, your balance will last ${daysSupported} days, comfortably covering the ${remaining} days left in the month.`,
      currency
    };
  }

  // Shortfall occurs before month ends
  const shortfallTimestamp = date.getTime() + (daysSupported * 24 * 60 * 60 * 1000);
  const shortfallDate = new Date(shortfallTimestamp).toISOString().split('T')[0];

  const status = daysSupported <= 3 ? 'HIGH_RISK' : 'CAUTION';

  return {
    daysSupported,
    daysRemaining: remaining,
    status,
    shortfallDate,
    averageDailySpending: avgDailySpending,
    availableBalance: balance,
    explanation: `At your current spending pace of ${sym}${avgDailySpending}/day, your available balance of ${sym}${balance} will last only ${daysSupported} days. You are projected to run out on ${shortfallDate}, before the month ends (${remaining} days remaining).`,
    currency
  };
};

/**
 * 3. Calculate Financial Health Score (0-100)
 * 
 * Weights:
 * - Budget Adherence: 25%
 * - Spending Pace: 25%
 * - Savings Progress: 20%
 * - Balance Health: 15%
 * - Expense Consistency: 15%
 */
const calculateFinancialHealthScore = ({
  totalBudget = null,
  totalSpentThisMonth = 0,
  currentBalance = 0,
  monthlyIncome = 0,
  savingsTarget = 0,
  savingsGoals = [],
  dailySpendings = [],
  daysElapsed = 1,
  daysInMonth = 30,
  currency = 'INR'
}) => {
  const sym = getSymbol(currency);
  const spent = Math.max(0, Number(totalSpentThisMonth) || 0);
  const balance = Number(currentBalance) || 0;
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const elapsed = Math.max(1, Number(daysElapsed) || 1);
  const totalDays = Math.max(1, Number(daysInMonth) || 30);

  // 1. Budget Adherence (25 pts)
  let budgetScore = 0;
  let budgetReason = '';

  if (totalBudget && totalBudget > 0) {
    const ratio = spent / totalBudget;
    if (ratio <= 0.75) {
      budgetScore = 25;
      budgetReason = `Excellent: You have used only ${round2(ratio * 100)}% of your monthly budget.`;
    } else if (ratio <= 1.0) {
      budgetScore = round2(25 - ((ratio - 0.75) / 0.25) * 7.5);
      budgetReason = `Good: You have used ${round2(ratio * 100)}% of your monthly budget.`;
    } else if (ratio <= 1.2) {
      budgetScore = round2(Math.max(0, 17.5 - ((ratio - 1.0) / 0.2) * 17.5));
      budgetReason = `Caution: You have exceeded your budget by ${round2((ratio - 1.0) * 100)}%.`;
    } else {
      budgetScore = 0;
      budgetReason = `Critical: You have severely exceeded your budget by ${round2((ratio - 1.0) * 100)}%.`;
    }
  } else if (income > 0) {
    const ratio = spent / income;
    if (ratio <= 0.6) {
      budgetScore = 22;
      budgetReason = `Spent ${round2(ratio * 100)}% of monthly income (no explicit budget set).`;
    } else if (ratio <= 0.85) {
      budgetScore = 17;
      budgetReason = `Spent ${round2(ratio * 100)}% of monthly income. Setting a budget is recommended.`;
    } else if (ratio <= 1.0) {
      budgetScore = 10;
      budgetReason = `Spent ${round2(ratio * 100)}% of monthly income. Close to limit.`;
    } else {
      budgetScore = 2;
      budgetReason = `Expenses exceed monthly income by ${round2((ratio - 1) * 100)}%.`;
    }
  } else {
    budgetScore = balance > 0 ? 15 : (balance === 0 ? 8 : 0);
    budgetReason = 'No budget or income profile configured. Score evaluated on cash balance.';
  }

  // 2. Spending Pace (25 pts)
  let paceScore = 0;
  let paceReason = '';

  const timeElapsedPercent = (elapsed / totalDays) * 100;
  const benchmarkAmount = (totalBudget && totalBudget > 0) ? totalBudget : (income > 0 ? income : (balance + spent || 1));
  const spendPercent = (spent / benchmarkAmount) * 100;

  if (spendPercent <= timeElapsedPercent) {
    paceScore = 25;
    paceReason = `On track: Spent ${round2(spendPercent)}% of funds with ${round2(timeElapsedPercent)}% of the month passed.`;
  } else if (spendPercent <= timeElapsedPercent + 10) {
    paceScore = 19;
    paceReason = `Slightly ahead: Spending pace is slightly faster than time elapsed.`;
  } else if (spendPercent <= timeElapsedPercent + 25) {
    paceScore = 11;
    paceReason = `Accelerated spending: Spent ${round2(spendPercent)}% while only ${round2(timeElapsedPercent)}% of month passed.`;
  } else {
    paceScore = 2;
    paceReason = `Heavy early spending: High risk of running out of money before month ends.`;
  }

  // 3. Savings Progress (20 pts)
  let savingsScore = 0;
  let savingsReason = '';

  if (savingsGoals && savingsGoals.length > 0) {
    const totalTarget = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const completedCount = savingsGoals.filter(g => g.status === 'completed').length;

    const ratio = totalTarget > 0 ? Math.min(1, totalSaved / totalTarget) : 0;
    savingsScore = round2(ratio * 16 + (completedCount > 0 ? 4 : 0));
    savingsScore = Math.min(20, Math.max(0, savingsScore));
    savingsReason = `Active progress: Saved ${sym}${totalSaved} towards ${sym}${totalTarget} across ${savingsGoals.length} goal(s).`;
  } else if (savingsTarget && savingsTarget > 0) {
    const netSavings = balance;
    if (netSavings >= savingsTarget) {
      savingsScore = 20;
      savingsReason = `Target met: Balance (${sym}${netSavings}) meets or exceeds monthly savings target (${sym}${savingsTarget}).`;
    } else if (netSavings > 0) {
      savingsScore = round2(Math.min(18, (netSavings / savingsTarget) * 20));
      savingsReason = `Partial progress: Balance covers ${round2((netSavings / savingsTarget) * 100)}% of savings target.`;
    } else {
      savingsScore = 4;
      savingsReason = `Savings target not met with current balance.`;
    }
  } else {
    savingsScore = balance > 0 ? 12 : 5;
    savingsReason = 'No active savings goals set. Setting a goal will improve your score.';
  }

  // 4. Balance Health (15 pts)
  let balanceScore = 0;
  let balanceReason = '';

  if (balance <= 0) {
    balanceScore = 0;
    balanceReason = balance < 0 ? `Negative balance: You are running a deficit of ${sym}${Math.abs(balance)}.` : `Zero balance: No buffer remaining.`;
  } else if (income > 0) {
    const ratio = balance / income;
    if (ratio >= 0.4) {
      balanceScore = 15;
      balanceReason = `Healthy cushion: Available balance is ${round2(ratio * 100)}% of your monthly income.`;
    } else if (ratio >= 0.2) {
      balanceScore = 11;
      balanceReason = `Moderate cushion: Available balance is ${round2(ratio * 100)}% of monthly income.`;
    } else {
      balanceScore = 6;
      balanceReason = `Low cushion: Balance is under 20% of monthly income.`;
    }
  } else {
    if (balance >= 5000) {
      balanceScore = 15;
      balanceReason = `Healthy available balance (${sym}${balance}).`;
    } else if (balance >= 1500) {
      balanceScore = 10;
      balanceReason = `Moderate available balance (${sym}${balance}).`;
    } else {
      balanceScore = 5;
      balanceReason = `Low available balance (${sym}${balance}).`;
    }
  }

  // 5. Expense Consistency (15 pts)
  let consistencyScore = 15;
  let consistencyReason = 'Spending is evenly distributed across days.';

  if (dailySpendings && dailySpendings.length > 1 && spent > 0) {
    const maxDaySpend = Math.max(...dailySpendings);
    const spikeRatio = maxDaySpend / spent;

    if (spikeRatio > 0.6) {
      consistencyScore = 5;
      consistencyReason = `Spike detected: A single day accounted for ${round2(spikeRatio * 100)}% of this month's total spending.`;
    } else if (spikeRatio > 0.4) {
      consistencyScore = 10;
      consistencyReason = `Moderate fluctuation: Top spending day accounted for ${round2(spikeRatio * 100)}% of total expenses.`;
    } else {
      consistencyScore = 15;
      consistencyReason = `Good consistency: Daily spending is well-regulated without major unexpected spikes.`;
    }
  } else if (spent === 0) {
    consistencyScore = 15;
    consistencyReason = 'No spending recorded yet this month.';
  }

  // Total Score (0-100)
  const totalScore = Math.min(100, Math.max(0, Math.round(
    budgetScore + paceScore + savingsScore + balanceScore + consistencyScore
  )));

  let grade = 'A';
  let summary = 'Excellent Financial Health';

  if (totalScore >= 80) {
    grade = 'A';
    summary = 'Excellent: Your finances are well-managed and on track.';
  } else if (totalScore >= 65) {
    grade = 'B';
    summary = 'Good: Financial habits are healthy with minor room for improvement.';
  } else if (totalScore >= 50) {
    grade = 'C';
    summary = 'Fair: Watch your spending pace and consider setting clearer budgets.';
  } else if (totalScore >= 35) {
    grade = 'D';
    summary = 'Needs Attention: High risk of overspending or depleting your buffer.';
  } else {
    grade = 'F';
    summary = 'Critical: Deficit or severe overspending. Immediate adjustments needed.';
  }

  return {
    score: totalScore,
    grade,
    summary,
    factors: {
      budgetAdherence: { score: round2(budgetScore), max: 25, reason: budgetReason },
      spendingPace: { score: round2(paceScore), max: 25, reason: paceReason },
      savingsProgress: { score: round2(savingsScore), max: 20, reason: savingsReason },
      balanceHealth: { score: round2(balanceScore), max: 15, reason: balanceReason },
      expenseConsistency: { score: round2(consistencyScore), max: 15, reason: consistencyReason }
    },
    currency
  };
};

/**
 * 4. Generate Smart Financial Suggestions
 */
const generateSmartSuggestions = ({
  categoryTotals = [],
  totalSpentThisMonth = 0,
  currentBalance = 0,
  monthlyIncome = 0,
  currentBudget = null,
  spendingPace = {},
  firstWeekSpend = 0,
  currency = 'INR'
}) => {
  const suggestions = [];
  const sym = getSymbol(currency);

  const balance = Number(currentBalance) || 0;
  const spent = Number(totalSpentThisMonth) || 0;
  const income = Number(monthlyIncome) || 0;

  // 1. Safe daily limit recommendation
  if (spendingPace.safeDailyLimit !== undefined) {
    if (balance > 0 && spendingPace.daysRemaining > 0) {
      suggestions.push({
        id: 'safe-daily-limit',
        type: 'action',
        priority: spendingPace.status === 'overspending' ? 'high' : 'medium',
        title: 'Daily Spending Guideline',
        message: `To make your remaining ${sym}${balance} last for the next ${spendingPace.daysRemaining} days, keep daily non-fixed spending under ${sym}${spendingPace.safeDailyLimit}/day.`
      });
    } else if (balance <= 0) {
      suggestions.push({
        id: 'negative-balance-alert',
        type: 'warning',
        priority: 'urgent',
        title: 'Zero / Deficit Balance Alert',
        message: `Your balance is ${sym}${balance}. Pause all non-essential expenditures immediately to avoid further debt.`
      });
    }
  }

  // 2. Early-month spending spike detection
  if (firstWeekSpend > 0 && income > 0) {
    const earlyRatio = firstWeekSpend / income;
    if (earlyRatio >= 0.4) {
      suggestions.push({
        id: 'early-month-spike',
        type: 'warning',
        priority: 'high',
        title: 'Early-Month Spending Spike',
        message: `You spent ${sym}${round2(firstWeekSpend)} (${round2(earlyRatio * 100)}% of your allowance) in the first week. Slow down your discretionary spending to prevent a cash crunch at month-end.`
      });
    }
  }

  // 3. Top category breakdown & optimization opportunities
  if (categoryTotals && categoryTotals.length > 0 && spent > 0) {
    const sorted = [...categoryTotals].sort((a, b) => b.total - a.total);
    const topCategory = sorted[0];

    if (topCategory && topCategory.total > 0) {
      const topPct = round2((topCategory.total / spent) * 100);
      if (topPct >= 30) {
        suggestions.push({
          id: 'top-category-alert',
          type: 'insight',
          priority: 'medium',
          title: `High Spending in ${topCategory.category}`,
          message: `${topCategory.category} is your highest expense category, taking up ${topPct}% (${sym}${topCategory.total}) of your spending this month.`
        });
      }
    }

    // Check discretionary categories common for students/hostellers
    const discretionaryNames = ['Snacks', 'Food', 'Entertainment', 'Shopping'];
    const discretionarySpend = sorted
      .filter(c => discretionaryNames.includes(c.category))
      .reduce((sum, c) => sum + c.total, 0);

    if (discretionarySpend > 0 && spent > 0) {
      const discPct = round2((discretionarySpend / spent) * 100);
      if (discPct >= 40) {
        const potentialSavings = round2(discretionarySpend * 0.2);
        suggestions.push({
          id: 'discretionary-reduction',
          type: 'saving_opportunity',
          priority: 'medium',
          title: 'Hostel Discretionary Savings Tip',
          message: `Discretionary items (Food/Snacks/Entertainment) account for ${discPct}% of your expenses. Reducing outside food and leisure by just 20% would save you approx ${sym}${potentialSavings} this month.`
        });
      }
    }
  }

  // 4. Budget overruns
  if (currentBudget && currentBudget.categoryBudgets && currentBudget.categoryBudgets.length > 0) {
    currentBudget.categoryBudgets.forEach(cb => {
      const match = categoryTotals.find(ct => ct.category.toLowerCase() === cb.category.toLowerCase());
      const budgetLimit = cb.displayAmount !== undefined ? cb.displayAmount : cb.amount;
      if (match && match.total > budgetLimit) {
        const overage = round2(match.total - budgetLimit);
        suggestions.push({
          id: `budget-overrun-${cb.category.toLowerCase()}`,
          type: 'warning',
          priority: 'high',
          title: `${cb.category} Budget Exceeded`,
          message: `You have spent ${sym}${match.total} on ${cb.category}, exceeding your set budget of ${sym}${budgetLimit} by ${sym}${overage}.`
        });
      }
    });
  }

  // 5. Positive reinforcement if on track and no alerts
  if (spendingPace.status === 'on_track' && balance > 0 && suggestions.length === 1) {
    suggestions.push({
      id: 'on-track-praise',
      type: 'positive',
      priority: 'low',
      title: 'Healthy Financial Discipline',
      message: 'You are pacing well below your limits this month. Consider directing a portion of your remaining safe margin towards a savings goal.'
    });
  }

  return suggestions;
};

/**
 * 5. Generate Smart Saving Plan
 */
const generateSmartSavingPlan = ({
  targetAmount,
  targetDate,
  monthlyIncome = 0,
  fixedExpenses = 0,
  categorySpendings = [],
  referenceDate = new Date(),
  currency = 'INR'
}) => {
  const target = Number(targetAmount);
  const sym = getSymbol(currency);
  if (isNaN(target) || target <= 0) {
    throw new Error('Target amount must be a positive number greater than 0');
  }

  const now = new Date(referenceDate);
  const targetTime = new Date(targetDate);

  if (isNaN(targetTime.getTime())) {
    throw new Error('Valid target date is required');
  }

  if (targetTime <= now) {
    throw new Error('Target date must be in the future');
  }

  // Time calculations
  const diffTime = targetTime.getTime() - now.getTime();
  const daysDiff = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const weeksDiff = Math.max(1, round2(daysDiff / 7));
  const monthsDiff = Math.max(0.1, round2(daysDiff / 30.44));

  const requiredDailySavings = round2(target / daysDiff);
  const requiredWeeklySavings = round2(target / weeksDiff);
  const requiredMonthlySavings = round2(target / monthsDiff);

  const income = Math.max(0, Number(monthlyIncome) || 0);
  const fixed = Math.max(0, Number(fixedExpenses) || 0);
  const availableMonthlyMargin = Math.max(0, income - fixed);

  // Feasibility assessment
  let isAchievable = true;
  let feasibility = 'REALISTIC';
  let feasibilityNote = '';

  if (income > 0) {
    if (requiredMonthlySavings > income) {
      isAchievable = false;
      feasibility = 'INCOMPATIBLE';
      feasibilityNote = `The required monthly savings of ${sym}${requiredMonthlySavings} exceeds your total monthly income (${sym}${income}). We recommend extending the target date or reducing the target amount.`;
    } else if (requiredMonthlySavings > availableMonthlyMargin) {
      isAchievable = false;
      feasibility = 'CHALLENGING';
      feasibilityNote = `The required savings of ${sym}${requiredMonthlySavings}/month exceeds your disposable income of ${sym}${availableMonthlyMargin}/month (after ${sym}${fixed} fixed expenses).`;
    } else if (requiredMonthlySavings > availableMonthlyMargin * 0.6) {
      feasibility = 'MODERATE';
      feasibilityNote = `Achievable, but will require disciplined cuts across non-essential spending.`;
    } else {
      feasibility = 'REALISTIC';
      feasibilityNote = `Comfortably achievable within your current financial profile.`;
    }
  } else {
    feasibility = 'ESTIMATED';
    feasibilityNote = `Based on required daily savings of ${sym}${requiredDailySavings}/day. Configure your monthly income in profile for deeper feasibility analysis.`;
  }

  // Category reduction recommendations
  const reductionSuggestions = [];
  const flexibleCategories = ['snacks', 'food', 'entertainment', 'shopping', 'recharge', 'other'];

  if (categorySpendings && categorySpendings.length > 0) {
    categorySpendings.forEach(cat => {
      const isFlexible = flexibleCategories.includes(cat.category.toLowerCase());
      if (isFlexible && cat.total > 200) {
        // Recommend 15% to 30% reduction depending on category
        const cutPercent = cat.category.toLowerCase() === 'snacks' || cat.category.toLowerCase() === 'entertainment' ? 0.3 : 0.2;
        const suggestedCut = round2(cat.total * cutPercent);
        const newBudget = round2(cat.total - suggestedCut);

        reductionSuggestions.push({
          category: cat.category,
          currentMonthlySpend: round2(cat.total),
          suggestedMonthlyCut: suggestedCut,
          proposedTarget: newBudget,
          explanation: `Cut ${round2(cutPercent * 100)}% from ${cat.category} spending to contribute ${sym}${suggestedCut}/month towards your goal.`
        });
      }
    });
  }

  return {
    targetAmount: target,
    targetDate: targetTime.toISOString().split('T')[0],
    daysRemaining: daysDiff,
    weeksRemaining: weeksDiff,
    monthsRemaining: round2(monthsDiff),
    requiredSavings: {
      daily: requiredDailySavings,
      weekly: requiredWeeklySavings,
      monthly: requiredMonthlySavings
    },
    feasibility: {
      status: feasibility,
      isAchievable,
      note: feasibilityNote,
      disposableIncome: availableMonthlyMargin
    },
    suggestedReductions: reductionSuggestions,
    disclaimer: 'These projections and suggested category reductions are estimates based on your parameters and do not guarantee future savings.',
    currency
  };
};

module.exports = {
  round2,
  getMonthProgress,
  calculateSpendingPace,
  calculateWillMoneyLast,
  calculateFinancialHealthScore,
  generateSmartSuggestions,
  generateSmartSavingPlan
};
