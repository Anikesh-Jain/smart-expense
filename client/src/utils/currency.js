/**
 * Enterprise Multi-Currency Utilities
 * 
 * Centralized source of truth for exchange rates, currency conversions,
 * dynamic symbol resolution, and defensive financial formatting.
 * Supported currencies: INR, USD, EUR, GBP, CAD, AUD, JPY.
 */

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  JPY: '¥',
};

export const CURRENCY_DECIMALS = {
  JPY: 0,
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
};

// Resilient fallback baseline exchange rates (USD base = 1.0)
export const BASELINE_RATES = {
  USD: 1.0,
  INR: 96.0,
  EUR: 0.92,
  GBP: 0.77,
  CAD: 1.39,
  AUD: 1.54,
  JPY: 152.0,
};

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
];

/**
 * Returns the symbol for a given currency code.
 * Defaults to '₹' for INR or '$' if unknown.
 */
export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) return '₹';
  const code = String(currencyCode).toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] || '₹';
};

/**
 * Convert an amount from one currency to another using high-precision math.
 * 
 * @param {number|string} amount
 * @param {string} fromCur
 * @param {string} toCur
 * @param {object} [rates]
 * @returns {number}
 */
export const convertCurrency = (amount, fromCur = 'INR', toCur = 'INR', rates = null) => {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num) || num === 0) return 0;

  const from = String(fromCur || 'INR').toUpperCase().trim();
  const to = String(toCur || 'INR').toUpperCase().trim();

  if (from === to) {
    return num;
  }

  const activeRates = rates || BASELINE_RATES;
  const fromRate = activeRates[from] || BASELINE_RATES[from] || 1.0;
  const toRate = activeRates[to] || BASELINE_RATES[to] || 1.0;

  return (num / fromRate) * toRate;
};

/**
 * Rounds a monetary amount according to the currency's precision rules.
 * JPY is rounded to 0 decimals, others to 2 decimals.
 */
export const roundCurrency = (amount, currencyCode = 'INR') => {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) return 0;

  const code = String(currencyCode || 'INR').toUpperCase().trim();
  const decimals = CURRENCY_DECIMALS[code] !== undefined ? CURRENCY_DECIMALS[code] : 2;

  if (decimals === 0) {
    return Math.round(num);
  }

  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Safely formats a numeric amount into a currency string.
 * Prevents NaN, null, undefined, or Infinity leaks into the UI.
 * Respects zero-decimal currencies (e.g. JPY).
 *
 * @param {number|string} amount
 * @param {string} [currencyCode='INR']
 * @param {boolean|null} [showDecimals=null] - null: auto by currency; true: force decimals; false: 0 decimals
 * @returns {string} e.g. "₹1,250.00", "$450.50", or "¥1,500"
 */
export const formatCurrency = (amount, currencyCode = 'INR', showDecimals = null) => {
  const num = Number(amount);
  const code = String(currencyCode || 'INR').toUpperCase().trim();
  const symbol = getCurrencySymbol(code);

  if (isNaN(num) || !isFinite(num)) {
    return `${symbol}0`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const defaultDecimals = CURRENCY_DECIMALS[code] !== undefined ? CURRENCY_DECIMALS[code] : 2;
  const decimals = code === 'JPY'
    ? 0
    : (showDecimals !== null ? (showDecimals ? 2 : 0) : defaultDecimals);

  const formattedNum = absNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
};

/**
 * High-level centralized helper that converts an amount if source and target currencies differ,
 * and then formats it cleanly.
 *
 * @param {number|string} amount
 * @param {string} sourceCurrency - Currency the amount is currently expressed in
 * @param {string} targetCurrency - Active display currency
 * @param {object} [options] - { showDecimals, showOriginal, rates }
 * @returns {string}
 */
export const formatFinancialAmount = (amount, sourceCurrency = 'INR', targetCurrency = 'INR', options = {}) => {
  const src = String(sourceCurrency || 'INR').toUpperCase().trim();
  const tgt = String(targetCurrency || 'INR').toUpperCase().trim();
  const rawNum = Number(amount) || 0;

  const converted = src === tgt
    ? rawNum
    : convertCurrency(rawNum, src, tgt, options.rates);

  const primary = formatCurrency(converted, tgt, options.showDecimals);

  if (options.showOriginal && src !== tgt) {
    const origDecimals = src !== 'JPY' && (rawNum % 1 !== 0);
    const orig = formatCurrency(rawNum, src, origDecimals);
    return `${primary} (orig. ${orig})`;
  }

  return primary;
};

/**
 * Derives presentation details for a transaction with multi-currency awareness.
 * Respects backend-provided displayAmount/displayCurrency when present, or converts using baseline rates.
 * Preserves original amount & currency.
 *
 * @param {object} tx - Transaction document or object
 * @param {string} activeDisplayCurrency - Active user display currency
 * @returns {object} { displayAmount, displayCurrency, originalAmount, originalCurrency, isDifferentCurrency, primaryText, secondaryText, fullText }
 */
export const getTransactionCurrencyDisplay = (tx, activeDisplayCurrency = 'INR') => {
  const displayCur = String(activeDisplayCurrency || 'INR').toUpperCase().trim();

  if (!tx) {
    return {
      displayAmount: 0,
      displayCurrency: displayCur,
      originalAmount: 0,
      originalCurrency: displayCur,
      isDifferentCurrency: false,
      primaryText: formatCurrency(0, displayCur),
      secondaryText: null,
      fullText: formatCurrency(0, displayCur),
    };
  }

  const origAmount = Number(tx.amount) || 0;
  const origCurrency = String(tx.currency || 'INR').toUpperCase().trim();

  let dispAmount = null;

  if (
    tx.displayAmount !== undefined &&
    tx.displayAmount !== null &&
    (!tx.displayCurrency || tx.displayCurrency.toUpperCase().trim() === displayCur)
  ) {
    dispAmount = Number(tx.displayAmount);
  } else if (origCurrency === displayCur) {
    dispAmount = origAmount;
  } else if (displayCur === 'USD' && tx.baseAmountUSD !== undefined && tx.baseAmountUSD !== null) {
    dispAmount = Number(tx.baseAmountUSD);
  } else {
    // Dynamic conversion fallback using central conversion engine
    dispAmount = convertCurrency(origAmount, origCurrency, displayCur);
  }

  dispAmount = roundCurrency(dispAmount, displayCur);

  const isDifferentCurrency = origCurrency !== displayCur;
  const primaryText = formatCurrency(dispAmount, displayCur);

  let secondaryText = null;
  if (isDifferentCurrency) {
    const origDecimals = origCurrency !== 'JPY' && (origAmount % 1 !== 0);
    const formattedOrig = formatCurrency(origAmount, origCurrency, origDecimals);
    secondaryText = `(orig. ${formattedOrig})`;
  }

  return {
    displayAmount: dispAmount,
    displayCurrency: displayCur,
    originalAmount: origAmount,
    originalCurrency: origCurrency,
    isDifferentCurrency,
    primaryText,
    secondaryText,
    fullText: secondaryText ? `${primaryText} ${secondaryText}` : primaryText,
  };
};

/**
 * Derives presentation details for a budget with multi-currency awareness.
 * Changing display currency never mutates the stored budget.
 *
 * @param {object} budget - Budget document or object
 * @param {string} activeDisplayCurrency - Active user display currency
 * @returns {object} { displayAmount, displayCurrency, originalAmount, originalCurrency, isDifferentCurrency, primaryText, secondaryText, fullText }
 */
export const getBudgetCurrencyDisplay = (budget, activeDisplayCurrency = 'INR') => {
  const displayCur = String(activeDisplayCurrency || 'INR').toUpperCase().trim();

  if (!budget) {
    return {
      displayAmount: 0,
      displayCurrency: displayCur,
      originalAmount: 0,
      originalCurrency: displayCur,
      isDifferentCurrency: false,
      primaryText: formatCurrency(0, displayCur),
      secondaryText: null,
      fullText: formatCurrency(0, displayCur),
    };
  }

  const origAmount = Number(budget.totalBudget) || 0;
  const origCurrency = String(budget.currency || 'INR').toUpperCase().trim();

  let dispAmount = null;

  if (
    budget.displayTotalBudget !== undefined &&
    budget.displayTotalBudget !== null &&
    (!budget.displayCurrency || budget.displayCurrency.toUpperCase().trim() === displayCur)
  ) {
    dispAmount = Number(budget.displayTotalBudget);
  } else if (origCurrency === displayCur) {
    dispAmount = origAmount;
  } else if (displayCur === 'USD' && budget.baseBudgetUSD !== undefined && budget.baseBudgetUSD !== null) {
    dispAmount = Number(budget.baseBudgetUSD);
  } else {
    // Dynamic conversion fallback using central conversion engine
    dispAmount = convertCurrency(origAmount, origCurrency, displayCur);
  }

  dispAmount = roundCurrency(dispAmount, displayCur);

  const isDifferentCurrency = origCurrency !== displayCur;
  const primaryText = formatCurrency(dispAmount, displayCur);

  let secondaryText = null;
  if (isDifferentCurrency) {
    const origDecimals = origCurrency !== 'JPY' && (origAmount % 1 !== 0);
    const formattedOrig = formatCurrency(origAmount, origCurrency, origDecimals);
    secondaryText = `(orig. ${formattedOrig})`;
  }

  return {
    displayAmount: dispAmount,
    displayCurrency: displayCur,
    originalAmount: origAmount,
    originalCurrency: origCurrency,
    isDifferentCurrency,
    primaryText,
    secondaryText,
    fullText: secondaryText ? `${primaryText} ${secondaryText}` : primaryText,
  };
};

/**
 * Derives presentation details for a savings goal with multi-currency awareness.
 *
 * @param {object} goal - SavingsGoal document or object
 * @param {string} activeDisplayCurrency - Active user display currency
 * @returns {object} { displayCurrentAmount, displayTargetAmount, displayCurrency, originalCurrentAmount, originalTargetAmount, originalCurrency, isDifferentCurrency }
 */
export const getSavingsGoalCurrencyDisplay = (goal, activeDisplayCurrency = 'INR') => {
  const displayCur = String(activeDisplayCurrency || 'INR').toUpperCase().trim();

  if (!goal) {
    return {
      displayCurrentAmount: 0,
      displayTargetAmount: 0,
      displayCurrency: displayCur,
      originalCurrentAmount: 0,
      originalTargetAmount: 0,
      originalCurrency: displayCur,
      isDifferentCurrency: false,
    };
  }

  const origCurrent = Number(goal.currentAmount) || 0;
  const origTarget = Number(goal.targetAmount) || 0;
  const origCurrency = String(goal.currency || 'INR').toUpperCase().trim();

  let dispCurrent = null;
  let dispTarget = null;

  if (
    goal.currentAmountInDisplayCurrency !== undefined &&
    goal.targetAmountInDisplayCurrency !== undefined &&
    (!goal.displayCurrency || goal.displayCurrency.toUpperCase().trim() === displayCur)
  ) {
    dispCurrent = Number(goal.currentAmountInDisplayCurrency);
    dispTarget = Number(goal.targetAmountInDisplayCurrency);
  } else if (origCurrency === displayCur) {
    dispCurrent = origCurrent;
    dispTarget = origTarget;
  } else {
    dispCurrent = convertCurrency(origCurrent, origCurrency, displayCur);
    dispTarget = convertCurrency(origTarget, origCurrency, displayCur);
  }

  dispCurrent = roundCurrency(dispCurrent, displayCur);
  dispTarget = roundCurrency(dispTarget, displayCur);

  return {
    displayCurrentAmount: dispCurrent,
    displayTargetAmount: dispTarget,
    displayCurrency: displayCur,
    originalCurrentAmount: origCurrent,
    originalTargetAmount: origTarget,
    originalCurrency: origCurrency,
    isDifferentCurrency: origCurrency !== displayCur,
  };
};
