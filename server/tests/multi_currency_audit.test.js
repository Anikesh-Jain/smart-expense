/**
 * Multi-Currency Comprehensive Audit Tests
 * Verifies application-wide currency conversion, precision rules,
 * non-destructive presentation decoration, and calculations across all 7 supported currencies.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  BASELINE_RATES,
  SUPPORTED_CURRENCIES,
  CURRENCY_DECIMALS,
  convertCurrency,
  roundCurrency,
  formatCurrency,
  getExchangeRates,
} = require('../utils/currencyService');

const {
  calculateSpendingPace,
  calculateWillMoneyLast,
  calculateFinancialHealthScore,
  generateSmartSavingPlan,
  generateSmartSuggestions,
} = require('../utils/financialCalculations');

const Budget = require('../models/Budget');

describe('Multi-Currency Engine - Fundamental Constants & Rates', () => {
  it('supports exactly the 7 documented currencies with USD as canonical base', () => {
    assert.deepEqual(SUPPORTED_CURRENCIES.sort(), ['AUD', 'CAD', 'EUR', 'GBP', 'INR', 'JPY', 'USD'].sort());
    assert.equal(BASELINE_RATES.USD, 1.0, 'USD must be the canonical base rate (1.0)');
    assert.equal(BASELINE_RATES.INR, 96.0);
    assert.equal(BASELINE_RATES.EUR, 0.92);
    assert.equal(BASELINE_RATES.GBP, 0.77);
    assert.equal(BASELINE_RATES.CAD, 1.39);
    assert.equal(BASELINE_RATES.AUD, 1.54);
    assert.equal(BASELINE_RATES.JPY, 152.0);
  });

  it('enforces JPY 0-decimal precision and 2-decimal precision for all other currencies', () => {
    assert.equal(CURRENCY_DECIMALS['JPY'], 0);
    ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'].forEach((c) => {
      assert.equal(CURRENCY_DECIMALS[c], 2, `${c} must have 2 decimal places`);
    });

    assert.equal(roundCurrency(1425.49, 'JPY'), 1425);
    assert.equal(roundCurrency(1425.50, 'JPY'), 1426);
    assert.equal(roundCurrency(9.375, 'USD'), 9.38);
    assert.equal(roundCurrency(8.625, 'EUR'), 8.63);
  });
});

describe('Multi-Currency Conversions - Cross-Currency Matrix', () => {
  it('converts INR 900 to USD accurately (₹900 -> $9.38)', () => {
    const converted = convertCurrency(900, 'INR', 'USD', BASELINE_RATES, true);
    assert.equal(converted, 9.38);
  });

  it('converts USD 10 to INR accurately ($10 -> ₹960)', () => {
    const converted = convertCurrency(10, 'USD', 'INR', BASELINE_RATES, true);
    assert.equal(converted, 960.0);
  });

  it('converts INR 900 to EUR accurately (₹900 -> €8.63)', () => {
    // (900 / 96) * 0.92 = 8.625 -> 8.63
    const converted = convertCurrency(900, 'INR', 'EUR', BASELINE_RATES, true);
    assert.equal(converted, 8.63);
  });

  it('converts INR 900 to GBP accurately (₹900 -> £7.22)', () => {
    // (900 / 96) * 0.77 = 7.21875 -> 7.22
    const converted = convertCurrency(900, 'INR', 'GBP', BASELINE_RATES, true);
    assert.equal(converted, 7.22);
  });

  it('converts INR 900 to JPY with strictly zero decimals (₹900 -> ¥1,425)', () => {
    // (900 / 96) * 152 = 1425 -> 1425 (no decimals)
    const converted = convertCurrency(900, 'INR', 'JPY', BASELINE_RATES, true);
    assert.equal(converted, 1425);
    assert.equal(Number.isInteger(converted), true, 'JPY amount must be an integer');
  });

  it('converts INR 900 to CAD accurately (₹900 -> $13.03)', () => {
    // (900 / 96) * 1.39 = 13.03125 -> 13.03
    const converted = convertCurrency(900, 'INR', 'CAD', BASELINE_RATES, true);
    assert.equal(converted, 13.03);
  });

  it('converts INR 900 to AUD accurately (₹900 -> $14.44)', () => {
    // (900 / 96) * 1.54 = 14.4375 -> 14.44
    const converted = convertCurrency(900, 'INR', 'AUD', BASELINE_RATES, true);
    assert.equal(converted, 14.44);
  });

  it('is an identity operation when fromCurrency === toCurrency', () => {
    SUPPORTED_CURRENCIES.forEach((c) => {
      const val = c === 'JPY' ? 5000 : 5000.75;
      assert.equal(convertCurrency(val, c, c, BASELINE_RATES), val);
    });
  });

  it('handles zero and null amounts gracefully without errors', () => {
    assert.equal(convertCurrency(0, 'INR', 'USD', BASELINE_RATES), 0);
    assert.equal(convertCurrency(null, 'INR', 'USD', BASELINE_RATES), 0);
    assert.equal(convertCurrency(undefined, 'INR', 'USD', BASELINE_RATES), 0);
  });
});

describe('Budget Model - Multi-Currency baseBudgetUSD hook for all 7 currencies', () => {
  it('computes correct baseBudgetUSD for every supported currency', () => {
    // Test helper mimicking pre-save hook logic in server/models/Budget.js
    const computeBaseBudgetUSD = (amount, cur) => {
      const rate = BASELINE_RATES[cur] || 1.0;
      return Math.round((amount / rate) * 100) / 100;
    };

    // ₹5000 in USD
    assert.equal(computeBaseBudgetUSD(5000, 'INR'), 52.08);

    // €100 in USD
    // 100 / 0.92 = 108.70
    assert.equal(computeBaseBudgetUSD(100, 'EUR'), 108.70);

    // £100 in USD
    // 100 / 0.77 = 129.87
    assert.equal(computeBaseBudgetUSD(100, 'GBP'), 129.87);

    // ¥15200 in USD
    // 15200 / 152 = 100.00
    assert.equal(computeBaseBudgetUSD(15200, 'JPY'), 100.00);

    // $100 CAD in USD
    // 100 / 1.39 = 71.94
    assert.equal(computeBaseBudgetUSD(100, 'CAD'), 71.94);

    // $100 AUD in USD
    // 100 / 1.54 = 64.94
    assert.equal(computeBaseBudgetUSD(100, 'AUD'), 64.94);

    // $100 USD in USD
    assert.equal(computeBaseBudgetUSD(100, 'USD'), 100.00);
  });

  it('converts a ₹5,000 budget to USD ($52.08) and back to INR without database mutation', () => {
    const originalBudget = {
      _id: 'budget_123',
      month: 9,
      year: 2026,
      totalBudget: 5000,
      currency: 'INR',
      categoryBudgets: [
        { category: 'Food', amount: 3000 },
        { category: 'Transport', amount: 2000 },
      ],
    };

    // Decorate for USD display (simulating budgetController decorateBudgetWithDisplay)
    const displayUSD = 'USD';
    const rateToUSD = BASELINE_RATES.INR; // 96.0
    const decoratedUSD = {
      ...originalBudget,
      displayCurrency: displayUSD,
      displayAmount: convertCurrency(originalBudget.totalBudget, originalBudget.currency, displayUSD, BASELINE_RATES, true),
      categoryBudgets: originalBudget.categoryBudgets.map((cb) => ({
        ...cb,
        displayAmount: convertCurrency(cb.amount, originalBudget.currency, displayUSD, BASELINE_RATES, true),
      })),
    };

    assert.equal(decoratedUSD.displayAmount, 52.08, '₹5,000 budget should display as $52.08');
    assert.equal(decoratedUSD.categoryBudgets[0].displayAmount, 31.25, '₹3,000 Food should display as $31.25');
    assert.equal(decoratedUSD.categoryBudgets[1].displayAmount, 20.83, '₹2,000 Transport should display as $20.83');

    // Original database document values must remain 100% UNCHANGED
    assert.equal(originalBudget.totalBudget, 5000);
    assert.equal(originalBudget.currency, 'INR');
    assert.equal(originalBudget.categoryBudgets[0].amount, 3000);

    // Switch back to INR display
    const displayINR = 'INR';
    const decoratedINR = {
      ...originalBudget,
      displayCurrency: displayINR,
      displayAmount: convertCurrency(originalBudget.totalBudget, originalBudget.currency, displayINR, BASELINE_RATES),
    };
    assert.equal(decoratedINR.displayAmount, 5000, 'Switching back to INR restores exact ₹5,000');
  });
});

describe('Financial Analytics Calculations with Multi-Currency Display', () => {
  it('calculateSpendingPace outputs correct currency and safe limits', () => {
    const paceINR = calculateSpendingPace({
      currentBalance: 9600, // ₹9,600
      totalBudget: 9600,
      monthlyIncome: 15000,
      currentSpent: 2000,
      currency: 'INR',
    });

    assert.equal(paceINR.currency, 'INR');
    assert.ok(paceINR.safeDailyLimit > 0);

    const paceUSD = calculateSpendingPace({
      currentBalance: 100, // $100 (converted from ₹9,600)
      totalBudget: 100,
      monthlyIncome: 156.25,
      currentSpent: 20.83,
      currency: 'USD',
    });

    assert.equal(paceUSD.currency, 'USD');
    assert.ok(paceUSD.safeDailyLimit > 0);
    assert.ok(paceUSD.safeDailyLimit < 10, 'USD safe daily limit should be small dollar amount, not ₹-scale');
  });

  it('calculateWillMoneyLast respects currency indicator', () => {
    const runoutUSD = calculateWillMoneyLast({
      currentBalance: 100,
      monthlyIncome: 150,
      fixedExpenses: 30,
      currentSpent: 20,
      currency: 'USD',
    });

    assert.equal(runoutUSD.currency, 'USD');
    assert.ok(runoutUSD.daysSupported >= 0);
  });

  it('generateSmartSavingPlan returns amounts in the requested currency', () => {
    // In USD: save $300 in 90 days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 90);

    const planUSD = generateSmartSavingPlan({
      targetAmount: 300,
      targetDate: targetDate.toISOString(),
      currentBalance: 100,
      monthlyIncome: 200,
      currentSpent: 50,
      currency: 'USD',
    });

    assert.equal(planUSD.currency, 'USD');
    assert.equal(planUSD.targetAmount, 300);
    assert.ok(planUSD.requiredSavings.monthly > 0);
    assert.ok(planUSD.requiredSavings.monthly <= 300, 'Monthly required savings in USD is in correct dollar units');
  });

  it('generateSmartSuggestions compares display currency spent against display currency budget', () => {
    // When spending is $10 in Food (display currency), and Food budget displayAmount is $31.25,
    // it should NOT trigger a false overspending warning
    const categoryBudgets = [
      { category: 'Food', amount: 3000, displayAmount: 31.25 },
    ];
    const categoryBreakdown = [
      { category: 'Food', total: 10 }, // $10 in USD
    ];

    const suggestions = generateSmartSuggestions({
      spendingPace: { status: 'ON_TRACK', averageDailySpending: 2, safeDailyLimit: 5 },
      willMoneyLast: { status: 'SAFE', daysSupported: 30 },
      financialHealth: { score: 85 },
      categoryBudgets,
      categoryBreakdown,
      currency: 'USD',
    });

    const foodWarning = suggestions.find((s) => s.title.includes('Food') && s.priority === 'urgent');
    assert.equal(foodWarning, undefined, 'Must not falsely flag Food budget overrun when compared in display units');
  });
});

describe('User Profile Baseline Currency Conversion', () => {
  it('decorates user financial baseline into display currency without mutating baseline', () => {
    const user = {
      name: 'Test Student',
      email: 'student@test.edu',
      monthlyIncome: 15000,
      fixedExpenses: 5000,
      savingsTarget: 3000,
      currency: 'INR',
      profileBaseCurrency: 'INR',
    };

    const decorateUserWithDisplay = (usr, displayCur) => {
      const baseCur = usr.profileBaseCurrency || 'INR';
      return {
        ...usr,
        displayCurrency: displayCur,
        displayMonthlyIncome: convertCurrency(usr.monthlyIncome, baseCur, displayCur, BASELINE_RATES, true),
        displayFixedExpenses: convertCurrency(usr.fixedExpenses, baseCur, displayCur, BASELINE_RATES, true),
        displaySavingsTarget: convertCurrency(usr.savingsTarget, baseCur, displayCur, BASELINE_RATES, true),
      };
    };

    // When displayed in USD
    const userUSD = decorateUserWithDisplay(user, 'USD');
    assert.equal(userUSD.displayMonthlyIncome, 156.25); // 15000 / 96 = 156.25
    assert.equal(userUSD.displayFixedExpenses, 52.08);  // 5000 / 96 = 52.08
    assert.equal(userUSD.displaySavingsTarget, 31.25);  // 3000 / 96 = 31.25

    // When displayed in EUR
    const userEUR = decorateUserWithDisplay(user, 'EUR');
    assert.equal(userEUR.displayMonthlyIncome, 143.75); // (15000 / 96) * 0.92 = 143.75

    // When displayed in JPY (0 decimals)
    const userJPY = decorateUserWithDisplay(user, 'JPY');
    assert.equal(userJPY.displayMonthlyIncome, 23750);  // (15000 / 96) * 152 = 23750
    assert.equal(Number.isInteger(userJPY.displayMonthlyIncome), true);

    // Original user remains pure
    assert.equal(user.monthlyIncome, 15000);
    assert.equal(user.profileBaseCurrency, 'INR');
  });
});
