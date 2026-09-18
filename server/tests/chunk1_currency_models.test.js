/**
 * Chunk 1 Verification Suite: Currency Foundation + Data Models
 * Uses node:test runner
 * 
 * Run: node --test server/tests/chunk1_currency_models.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_DECIMALS,
  BASELINE_RATES,
  getExchangeRates,
  convertCurrency,
  roundCurrency,
  formatCurrency,
  getCurrencySymbol
} = require('../utils/currencyService');

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');

describe('Chunk 1: Currency Foundation Service', () => {
  it('defines the 7 required supported currencies', () => {
    assert.deepEqual(SUPPORTED_CURRENCIES, ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']);
  });

  it('defines distinct currency symbols for all supported currencies', () => {
    assert.equal(CURRENCY_SYMBOLS.INR, '₹');
    assert.equal(CURRENCY_SYMBOLS.USD, '$');
    assert.equal(CURRENCY_SYMBOLS.EUR, '€');
    assert.equal(CURRENCY_SYMBOLS.GBP, '£');
    assert.equal(CURRENCY_SYMBOLS.CAD, '$');
    assert.equal(CURRENCY_SYMBOLS.AUD, '$');
    assert.equal(CURRENCY_SYMBOLS.JPY, '¥');
  });

  it('fetches or provides exchange rates with explicit provenance metadata', async () => {
    const rateData = await getExchangeRates();
    assert.ok(rateData.rates, 'Rates object must exist');
    assert.ok(['live', 'cache', 'fallback'].includes(rateData.provider), 'Provider must be live, cache, or fallback');
    assert.equal(typeof rateData.isFallback, 'boolean');
    assert.equal(typeof rateData.isStale, 'boolean');
    assert.equal(rateData.rates.USD, 1.0);
    assert.ok(rateData.rates.INR > 0);
  });

  it('performs unrounded floating-point conversion between currencies', () => {
    const customRates = {
      USD: 1.0,
      INR: 100.0,
      EUR: 0.8
    };

    // ₹900 at 100 INR/USD should be 9.0 USD
    const usdVal = convertCurrency(900, 'INR', 'USD', customRates);
    assert.equal(usdVal, 9.0);

    // 9.0 USD at 100 INR/USD should be 900 INR
    const inrVal = convertCurrency(9.0, 'USD', 'INR', customRates);
    assert.equal(inrVal, 900);

    // ₹900 at 100 INR/USD and 0.8 EUR/USD should be 7.2 EUR
    const eurVal = convertCurrency(900, 'INR', 'EUR', customRates);
    assert.equal(eurVal, 7.2);

    // Same-currency identity
    assert.equal(convertCurrency(900, 'INR', 'INR', customRates), 900);

    // Zero amount
    assert.equal(convertCurrency(0, 'INR', 'USD', customRates), 0);

    // Decimal amount precision without premature rounding
    const unrounded = convertCurrency(123.4567, 'USD', 'INR', customRates);
    assert.equal(unrounded, 12345.67);
  });

  it('enforces presentation rounding rules: JPY=0 decimals, others=2 decimals', () => {
    assert.equal(roundCurrency(123.456, 'USD'), 123.46);
    assert.equal(roundCurrency(123.456, 'INR'), 123.46);
    assert.equal(roundCurrency(123.456, 'JPY'), 123);
    assert.equal(roundCurrency(123.89, 'JPY'), 124);
  });

  it('formats currency dynamically with appropriate symbol and decimals', () => {
    assert.equal(formatCurrency(900, 'INR'), '₹900.00');
    assert.equal(formatCurrency(9.38, 'USD'), '$9.38');
    assert.equal(formatCurrency(1500, 'JPY'), '¥1,500');
  });
});

describe('Chunk 1: Data Model Schemas', () => {
  it('Transaction schema includes currency, baseAmountUSD, and historicalRateToUSD', () => {
    const paths = Transaction.schema.paths;
    assert.ok(paths['currency'], 'Transaction must have currency path');
    assert.ok(paths['baseAmountUSD'], 'Transaction must have baseAmountUSD path');
    assert.ok(paths['historicalRateToUSD'], 'Transaction must have historicalRateToUSD path');
    assert.equal(paths['currency'].defaultValue, 'INR');
  });

  it('Budget schema includes currency and baseBudgetUSD', () => {
    const paths = Budget.schema.paths;
    assert.ok(paths['currency'], 'Budget must have currency path');
    assert.ok(paths['baseBudgetUSD'], 'Budget must have baseBudgetUSD path');
    assert.equal(paths['currency'].defaultValue, 'INR');
  });

  it('SavingsGoal schema includes currency and detailed contribution snapshots', () => {
    const paths = SavingsGoal.schema.paths;
    assert.ok(paths['currency'], 'SavingsGoal must have currency path');
    assert.equal(paths['currency'].defaultValue, 'INR');

    const contribPaths = paths['contributions'].schema.paths;
    assert.ok(contribPaths['amount'], 'Contributions must have amount');
    assert.ok(contribPaths['currency'], 'Contributions must have currency');
    assert.ok(contribPaths['convertedAmountToGoalCurrency'], 'Contributions must have convertedAmountToGoalCurrency');
    assert.ok(contribPaths['exchangeRate'], 'Contributions must have exchangeRate');
    assert.ok(contribPaths['rateTimestamp'], 'Contributions must have rateTimestamp');
    assert.ok(contribPaths['rateProvider'], 'Contributions must have rateProvider');
  });

  it('User schema distinguishes display currency from profileBaseCurrency', () => {
    const paths = User.schema.paths;
    assert.ok(paths['currency'], 'User must have currency (display preference)');
    assert.ok(paths['profileBaseCurrency'], 'User must have profileBaseCurrency (input currency)');
    assert.equal(paths['currency'].defaultValue, 'INR');
    assert.equal(paths['profileBaseCurrency'].defaultValue, 'INR');
  });
});
