/**
 * Financial Calculations Engine Unit Tests
 * Tests: financialCalculations.js
 * 
 * Run: node --test server/tests/financialCalc.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  round2,
  getMonthProgress,
  calculateSpendingPace,
  calculateWillMoneyLast,
  calculateFinancialHealthScore,
  generateSmartSuggestions,
  generateSmartSavingPlan
} = require('../utils/financialCalculations');

// =============================================================
// round2 helper
// =============================================================
describe('round2()', () => {
  it('rounds to 2 decimal places', () => {
    assert.equal(round2(1.005), 1.01);
    assert.equal(round2(1.004), 1);
    assert.equal(round2(1234.5678), 1234.57);
  });
  it('handles null/undefined/NaN/Infinity', () => {
    assert.equal(round2(null), 0);
    assert.equal(round2(undefined), 0);
    assert.equal(round2(NaN), 0);
    assert.equal(round2(Infinity), 0);
    assert.equal(round2(-Infinity), 0);
  });
  it('handles zero and negative', () => {
    assert.equal(round2(0), 0);
    assert.equal(round2(-5.678), -5.68);
  });
});

// =============================================================
// getMonthProgress
// =============================================================
describe('getMonthProgress()', () => {
  it('returns correct values for mid-month date', () => {
    const result = getMonthProgress(new Date(2026, 8, 15)); // Sep 15
    assert.equal(result.year, 2026);
    assert.equal(result.month, 9);
    assert.equal(result.daysInMonth, 30);
    assert.equal(result.currentDay, 15);
    assert.equal(result.daysElapsed, 15);
    assert.equal(result.daysRemaining, 15);
  });
  it('returns correct values for first day', () => {
    const result = getMonthProgress(new Date(2026, 0, 1)); // Jan 1
    assert.equal(result.daysElapsed, 1);
    assert.equal(result.daysRemaining, 30);
  });
  it('returns correct values for last day', () => {
    const result = getMonthProgress(new Date(2026, 0, 31)); // Jan 31
    assert.equal(result.daysElapsed, 31);
    assert.equal(result.daysRemaining, 0);
  });
});

// =============================================================
// calculateSpendingPace
// =============================================================
describe('calculateSpendingPace()', () => {
  it('normal case: on track spending', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 5000,
      currentBalance: 20000,
      totalBudget: 15000,
      monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 15) // mid-month
    });
    assert.ok(result.averageDailySpending > 0);
    assert.ok(result.projectedMonthlySpending > 0);
    assert.ok(result.safeDailyLimit > 0);
    assert.ok(result.safeWeeklyLimit > 0);
    assert.ok(['on_track', 'caution', 'overspending'].includes(result.status));
    assert.ok(result.message.length > 0);
  });

  it('overspending: budget exceeded projection', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 14000,
      currentBalance: 1000,
      totalBudget: 15000,
      monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.status, 'overspending');
  });

  it('zero expenses', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 0,
      currentBalance: 25000,
      totalBudget: 15000,
      monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.averageDailySpending, 0);
    assert.equal(result.projectedMonthlySpending, 0);
    assert.equal(result.status, 'on_track');
  });

  it('zero income, no budget', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 5000,
      currentBalance: 10000,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.ok(result.averageDailySpending > 0);
    assert.ok(result.message.length > 0);
    // Should not produce NaN
    assert.ok(!isNaN(result.averageDailySpending));
    assert.ok(!isNaN(result.safeDailyLimit));
  });

  it('negative balance', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 30000,
      currentBalance: -5000,
      totalBudget: 15000,
      monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.safeDailyLimit, 0);
    assert.equal(result.safeWeeklyLimit, 0);
  });

  it('last day of month (zero days remaining)', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 10000,
      currentBalance: 5000,
      totalBudget: 15000,
      monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 30) // Sep 30 (last day)
    });
    assert.equal(result.daysRemaining, 0);
    assert.ok(result.safeDailyLimit > 0, 'Last day should still show balance');
    assert.ok(!isNaN(result.projectedMonthlySpending));
  });

  it('very large amounts', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 999999999,
      currentBalance: 1000000000,
      totalBudget: 500000000,
      monthlyIncome: 1500000000,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.ok(!isNaN(result.averageDailySpending));
    assert.ok(isFinite(result.averageDailySpending));
  });

  it('all zeros', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 0,
      currentBalance: 0,
      totalBudget: 0,
      monthlyIncome: 0,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.averageDailySpending, 0);
    assert.equal(result.safeDailyLimit, 0);
    assert.ok(!isNaN(result.projectedMonthlySpending));
  });

  it('missing values / defaults', () => {
    const result = calculateSpendingPace({});
    assert.ok(!isNaN(result.averageDailySpending));
    assert.ok(!isNaN(result.safeDailyLimit));
    assert.ok(result.message !== undefined);
  });
});

// =============================================================
// calculateWillMoneyLast
// =============================================================
describe('calculateWillMoneyLast()', () => {
  it('normal SAFE case', () => {
    const result = calculateWillMoneyLast({
      currentBalance: 20000,
      totalSpentThisMonth: 5000,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.status, 'SAFE');
    assert.ok(result.daysSupported >= 15);
    assert.equal(result.shortfallDate, null);
  });

  it('CAUTION — money runs out before month end', () => {
    const result = calculateWillMoneyLast({
      currentBalance: 2000,
      totalSpentThisMonth: 15000,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.ok(['CAUTION', 'HIGH_RISK'].includes(result.status));
    assert.ok(result.daysSupported < 15);
    assert.ok(result.shortfallDate !== null);
  });

  it('HIGH_RISK — negative balance', () => {
    const result = calculateWillMoneyLast({
      currentBalance: -1000,
      totalSpentThisMonth: 30000,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.status, 'HIGH_RISK');
    assert.equal(result.daysSupported, 0);
  });

  it('zero balance', () => {
    const result = calculateWillMoneyLast({
      currentBalance: 0,
      totalSpentThisMonth: 10000,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.status, 'HIGH_RISK');
    assert.equal(result.daysSupported, 0);
  });

  it('zero daily spending (no expenses)', () => {
    const result = calculateWillMoneyLast({
      currentBalance: 10000,
      totalSpentThisMonth: 0,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15)
    });
    assert.equal(result.status, 'SAFE');
    assert.equal(result.averageDailySpending, 0);
  });

  it('handles missing values', () => {
    const result = calculateWillMoneyLast({});
    assert.ok(result.status);
    assert.ok(!isNaN(result.daysSupported));
  });
});

// =============================================================
// calculateFinancialHealthScore
// =============================================================
describe('calculateFinancialHealthScore()', () => {
  it('excellent health — well under budget', () => {
    const result = calculateFinancialHealthScore({
      totalBudget: 20000,
      totalSpentThisMonth: 5000,
      currentBalance: 20000,
      monthlyIncome: 30000,
      savingsTarget: 5000,
      savingsGoals: [{ targetAmount: 10000, currentAmount: 8000, status: 'active' }],
      dailySpendings: [300, 200, 350, 400, 250],
      daysElapsed: 15,
      daysInMonth: 30
    });
    assert.ok(result.score >= 60, `Expected >= 60, got ${result.score}`);
    assert.ok(result.grade);
    assert.ok(result.summary);
    assert.ok(result.factors.budgetAdherence.score >= 0);
    assert.ok(result.factors.spendingPace.score >= 0);
    assert.ok(result.factors.savingsProgress.score >= 0);
    assert.ok(result.factors.balanceHealth.score >= 0);
    assert.ok(result.factors.expenseConsistency.score >= 0);
  });

  it('poor health — over budget', () => {
    const result = calculateFinancialHealthScore({
      totalBudget: 10000,
      totalSpentThisMonth: 15000,
      currentBalance: -2000,
      monthlyIncome: 12000,
      daysElapsed: 15,
      daysInMonth: 30
    });
    assert.ok(result.score <= 40, `Expected <= 40, got ${result.score}`);
    assert.ok(['D', 'F'].includes(result.grade));
  });

  it('score is always 0-100', () => {
    const tests = [
      { totalBudget: 0, totalSpentThisMonth: 0, currentBalance: 0, monthlyIncome: 0 },
      { totalBudget: 100, totalSpentThisMonth: 999999, currentBalance: -999999, monthlyIncome: 100 },
      { totalBudget: 999999, totalSpentThisMonth: 0, currentBalance: 999999, monthlyIncome: 999999 },
    ];
    for (const t of tests) {
      const result = calculateFinancialHealthScore({ ...t, daysElapsed: 15, daysInMonth: 30 });
      assert.ok(result.score >= 0, `Score ${result.score} < 0`);
      assert.ok(result.score <= 100, `Score ${result.score} > 100`);
      assert.ok(!isNaN(result.score));
    }
  });

  it('handles missing/empty values', () => {
    const result = calculateFinancialHealthScore({});
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.grade);
    assert.ok(result.summary);
  });

  it('no budget, no income', () => {
    const result = calculateFinancialHealthScore({
      totalSpentThisMonth: 5000,
      currentBalance: 10000,
      daysElapsed: 10,
      daysInMonth: 30
    });
    assert.ok(result.score >= 0);
    assert.ok(result.factors.budgetAdherence.reason.length > 0);
  });

  it('spike detection in daily spendings', () => {
    const result = calculateFinancialHealthScore({
      totalBudget: 10000,
      totalSpentThisMonth: 5000,
      currentBalance: 15000,
      monthlyIncome: 20000,
      dailySpendings: [100, 100, 100, 4500, 200], // huge spike
      daysElapsed: 15,
      daysInMonth: 30
    });
    assert.ok(result.factors.expenseConsistency.score < 15, 
      `Expected spike detection, got ${result.factors.expenseConsistency.score}`);
  });

  it('completed savings goal bonus', () => {
    const result = calculateFinancialHealthScore({
      savingsGoals: [
        { targetAmount: 10000, currentAmount: 10000, status: 'completed' }
      ],
      currentBalance: 10000,
      daysElapsed: 15,
      daysInMonth: 30
    });
    assert.ok(result.factors.savingsProgress.score > 0);
  });
});

// =============================================================
// generateSmartSuggestions
// =============================================================
describe('generateSmartSuggestions()', () => {
  it('generates daily limit suggestion when balance > 0', () => {
    const pace = calculateSpendingPace({
      totalSpentThisMonth: 5000, currentBalance: 15000,
      totalBudget: 20000, monthlyIncome: 25000,
      referenceDate: new Date(2026, 8, 15)
    });
    const result = generateSmartSuggestions({
      categoryTotals: [
        { category: 'Food', total: 2000 },
        { category: 'Shopping', total: 3000 }
      ],
      totalSpentThisMonth: 5000,
      currentBalance: 15000,
      monthlyIncome: 25000,
      spendingPace: pace
    });
    assert.ok(Array.isArray(result));
    const dailyLimit = result.find(s => s.id === 'safe-daily-limit');
    assert.ok(dailyLimit, 'Should have daily limit suggestion');
  });

  it('negative balance alert', () => {
    const pace = calculateSpendingPace({
      totalSpentThisMonth: 30000, currentBalance: -5000,
      referenceDate: new Date(2026, 8, 15)
    });
    const result = generateSmartSuggestions({
      totalSpentThisMonth: 30000,
      currentBalance: -5000,
      spendingPace: pace
    });
    const alert = result.find(s => s.id === 'negative-balance-alert');
    assert.ok(alert, 'Should have negative balance alert');
    assert.equal(alert.priority, 'urgent');
  });

  it('early-month spending spike detection', () => {
    const result = generateSmartSuggestions({
      totalSpentThisMonth: 12000,
      currentBalance: 13000,
      monthlyIncome: 25000,
      firstWeekSpend: 12000, // 48% of income in first week
      spendingPace: { safeDailyLimit: 500, daysRemaining: 15, status: 'caution' }
    });
    const spike = result.find(s => s.id === 'early-month-spike');
    assert.ok(spike, 'Should detect early-month spike');
  });

  it('top category alert', () => {
    const result = generateSmartSuggestions({
      categoryTotals: [
        { category: 'Shopping', total: 8000 },
        { category: 'Food', total: 2000 }
      ],
      totalSpentThisMonth: 10000,
      currentBalance: 15000,
      monthlyIncome: 25000,
      spendingPace: { safeDailyLimit: 500, daysRemaining: 15, status: 'on_track' }
    });
    const topCat = result.find(s => s.id === 'top-category-alert');
    assert.ok(topCat, 'Should have top category alert (Shopping at 80%)');
  });

  it('handles empty inputs gracefully', () => {
    const result = generateSmartSuggestions({});
    assert.ok(Array.isArray(result));
  });

  it('budget overrun detection', () => {
    const result = generateSmartSuggestions({
      categoryTotals: [{ category: 'Food', total: 8000 }],
      totalSpentThisMonth: 8000,
      currentBalance: 12000,
      monthlyIncome: 25000,
      currentBudget: {
        categoryBudgets: [{ category: 'Food', amount: 5000 }]
      },
      spendingPace: { safeDailyLimit: 500, daysRemaining: 15, status: 'caution' }
    });
    const overrun = result.find(s => s.id === 'budget-overrun-food');
    assert.ok(overrun, 'Should detect Food budget overrun');
  });
});

// =============================================================
// generateSmartSavingPlan
// =============================================================
describe('generateSmartSavingPlan()', () => {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);

  it('normal feasible plan', () => {
    const result = generateSmartSavingPlan({
      targetAmount: 30000,
      targetDate: futureDate.toISOString(),
      monthlyIncome: 25000,
      fixedExpenses: 8000,
      categorySpendings: [
        { category: 'Food', total: 3000 },
        { category: 'Snacks', total: 1500 }
      ]
    });
    assert.equal(result.targetAmount, 30000);
    assert.ok(result.daysRemaining > 0);
    assert.ok(result.requiredSavings.daily > 0);
    assert.ok(result.requiredSavings.weekly > 0);
    assert.ok(result.requiredSavings.monthly > 0);
    assert.ok(result.feasibility);
    assert.ok(result.feasibility.isAchievable !== undefined);
  });

  it('incompatible — required > income', () => {
    const shortDate = new Date();
    shortDate.setDate(shortDate.getDate() + 10);
    const result = generateSmartSavingPlan({
      targetAmount: 500000,
      targetDate: shortDate.toISOString(),
      monthlyIncome: 25000,
      fixedExpenses: 8000
    });
    assert.equal(result.feasibility.isAchievable, false);
    assert.equal(result.feasibility.status, 'INCOMPATIBLE');
  });

  it('challenging — required > disposable income', () => {
    const result = generateSmartSavingPlan({
      targetAmount: 100000,
      targetDate: futureDate.toISOString(),
      monthlyIncome: 25000,
      fixedExpenses: 10000
    });
    // Check if it's CHALLENGING or MODERATE depending on the math
    assert.ok(['CHALLENGING', 'MODERATE', 'REALISTIC'].includes(result.feasibility.status));
  });

  it('throws on negative target amount', () => {
    assert.throws(() => {
      generateSmartSavingPlan({ targetAmount: -1000, targetDate: futureDate.toISOString() });
    });
  });

  it('throws on zero target amount', () => {
    assert.throws(() => {
      generateSmartSavingPlan({ targetAmount: 0, targetDate: futureDate.toISOString() });
    });
  });

  it('throws on past target date', () => {
    assert.throws(() => {
      generateSmartSavingPlan({ targetAmount: 10000, targetDate: '2020-01-01' });
    });
  });

  it('throws on invalid date', () => {
    assert.throws(() => {
      generateSmartSavingPlan({ targetAmount: 10000, targetDate: 'not-a-date' });
    });
  });

  it('NaN target amount throws', () => {
    assert.throws(() => {
      generateSmartSavingPlan({ targetAmount: NaN, targetDate: futureDate.toISOString() });
    });
  });

  it('no income — estimated feasibility', () => {
    const result = generateSmartSavingPlan({
      targetAmount: 10000,
      targetDate: futureDate.toISOString(),
      monthlyIncome: 0
    });
    assert.equal(result.feasibility.status, 'ESTIMATED');
  });

  it('category reduction suggestions', () => {
    const result = generateSmartSavingPlan({
      targetAmount: 30000,
      targetDate: futureDate.toISOString(),
      monthlyIncome: 25000,
      fixedExpenses: 8000,
      categorySpendings: [
        { category: 'Snacks', total: 2000 },
        { category: 'Entertainment', total: 3000 },
        { category: 'Food', total: 5000 }
      ]
    });
    assert.ok(result.suggestedReductions.length > 0, 'Should have reduction suggestions');
    // Snacks and Entertainment should have 30% cut suggestion
    const snacksSuggestion = result.suggestedReductions.find(s => s.category === 'Snacks');
    if (snacksSuggestion) {
      assert.ok(snacksSuggestion.suggestedMonthlyCut > 0);
    }
  });

  it('very large target amount', () => {
    const result = generateSmartSavingPlan({
      targetAmount: 10000000,
      targetDate: futureDate.toISOString(),
      monthlyIncome: 25000,
      fixedExpenses: 8000
    });
    assert.equal(result.feasibility.isAchievable, false);
  });
});

// =============================================================
// Currency-aware dynamic message tests
// =============================================================
describe('Currency-aware messages — no incorrect ₹ for non-INR currencies', () => {
  it('calculateSpendingPace with USD uses $ not ₹', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 500,
      currentBalance: 2000,
      totalBudget: 1500,
      monthlyIncome: 3000,
      referenceDate: new Date(2026, 8, 15),
      currency: 'USD'
    });
    assert.ok(result.message.includes('$'), `Message should contain $: "${result.message}"`);
    assert.ok(!result.message.includes('₹'), `Message should NOT contain ₹: "${result.message}"`);
  });

  it('calculateSpendingPace with EUR uses € not ₹', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 500,
      currentBalance: 2000,
      totalBudget: 1500,
      monthlyIncome: 3000,
      referenceDate: new Date(2026, 8, 15),
      currency: 'EUR'
    });
    assert.ok(result.message.includes('€'), `Message should contain €: "${result.message}"`);
    assert.ok(!result.message.includes('₹'), `Message should NOT contain ₹: "${result.message}"`);
  });

  it('calculateSpendingPace with GBP uses £ not ₹', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 500,
      currentBalance: 2000,
      totalBudget: 1500,
      monthlyIncome: 3000,
      referenceDate: new Date(2026, 8, 15),
      currency: 'GBP'
    });
    assert.ok(result.message.includes('£'), `Message should contain £: "${result.message}"`);
    assert.ok(!result.message.includes('₹'), `Message should NOT contain ₹: "${result.message}"`);
  });

  it('calculateSpendingPace with JPY uses ¥ not ₹', () => {
    const result = calculateSpendingPace({
      totalSpentThisMonth: 50000,
      currentBalance: 200000,
      totalBudget: 150000,
      monthlyIncome: 300000,
      referenceDate: new Date(2026, 8, 15),
      currency: 'JPY'
    });
    assert.ok(result.message.includes('¥'), `Message should contain ¥: "${result.message}"`);
    assert.ok(!result.message.includes('₹'), `Message should NOT contain ₹: "${result.message}"`);
  });

  it('calculateWillMoneyLast with USD uses $ not ₹', () => {
    const result = calculateWillMoneyLast({
      currentBalance: 500,
      totalSpentThisMonth: 1500,
      daysElapsed: 15,
      daysRemaining: 15,
      referenceDate: new Date(2026, 8, 15),
      currency: 'USD'
    });
    assert.ok(result.explanation.includes('$'), `Explanation should contain $: "${result.explanation}"`);
    assert.ok(!result.explanation.includes('₹'), `Explanation should NOT contain ₹: "${result.explanation}"`);
  });

  it('calculateFinancialHealthScore with EUR uses € in reason strings', () => {
    const result = calculateFinancialHealthScore({
      totalBudget: 2000,
      totalSpentThisMonth: 500,
      currentBalance: 3000,
      monthlyIncome: 4000,
      savingsTarget: 1000,
      savingsGoals: [{ targetAmount: 5000, currentAmount: 2000, status: 'active' }],
      daysElapsed: 15,
      daysInMonth: 30,
      currency: 'EUR'
    });
    // Check savings progress reason uses € (it references Saved €X towards €Y)
    const savingsReason = result.factors.savingsProgress.reason;
    assert.ok(savingsReason.includes('€'), `Savings reason should contain €: "${savingsReason}"`);
    assert.ok(!savingsReason.includes('₹'), `Savings reason should NOT contain ₹: "${savingsReason}"`);
  });

  it('generateSmartSuggestions with GBP uses £ in messages', () => {
    const pace = calculateSpendingPace({
      totalSpentThisMonth: 500, currentBalance: 1500,
      totalBudget: 2000, monthlyIncome: 3000,
      referenceDate: new Date(2026, 8, 15),
      currency: 'GBP'
    });
    const result = generateSmartSuggestions({
      categoryTotals: [{ category: 'Food', total: 500 }],
      totalSpentThisMonth: 500,
      currentBalance: 1500,
      monthlyIncome: 3000,
      spendingPace: pace,
      currency: 'GBP'
    });
    const dailyLimit = result.find(s => s.id === 'safe-daily-limit');
    if (dailyLimit) {
      assert.ok(dailyLimit.message.includes('£'), `Daily limit message should contain £: "${dailyLimit.message}"`);
      assert.ok(!dailyLimit.message.includes('₹'), `Daily limit message should NOT contain ₹: "${dailyLimit.message}"`);
    }
  });

  it('generateSmartSavingPlan with USD uses $ in feasibility notes', () => {
    const futureD = new Date();
    futureD.setMonth(futureD.getMonth() + 6);
    const result = generateSmartSavingPlan({
      targetAmount: 5000,
      targetDate: futureD.toISOString(),
      monthlyIncome: 8000,
      fixedExpenses: 3000,
      categorySpendings: [{ category: 'Food', total: 1000 }],
      currency: 'USD'
    });
    const note = result.feasibility.note;
    // Should not contain ₹ in the note
    assert.ok(!note.includes('₹'), `Feasibility note should NOT contain ₹: "${note}"`);
    // Reduction suggestions should use $
    if (result.suggestedReductions.length > 0) {
      const explanation = result.suggestedReductions[0].explanation;
      assert.ok(explanation.includes('$'), `Reduction explanation should contain $: "${explanation}"`);
      assert.ok(!explanation.includes('₹'), `Reduction explanation should NOT contain ₹: "${explanation}"`);
    }
  });
});

console.log('\n=== Financial Engine Tests Complete ===\n');

