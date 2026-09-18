/**
 * Currency utility helpers for dynamic symbol resolution and defensive formatting.
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
 * Safely formats a numeric amount into a currency string.
 * Prevents NaN, null, undefined, or Infinity leaks into the UI.
 * Respects zero-decimal currencies (e.g. JPY).
 *
 * @param {number|string} amount
 * @param {string} currencyCode
 * @param {boolean} [showDecimals=false]
 * @returns {string} e.g. "₹1,250" or "$450.50"
 */
export const formatCurrency = (amount, currencyCode = 'INR', showDecimals = false) => {
  const num = Number(amount);
  const code = (currencyCode || 'INR').toUpperCase().trim();
  const symbol = getCurrencySymbol(code);

  if (isNaN(num) || !isFinite(num)) {
    return `${symbol}0`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // JPY never has decimal sub-units
  const isZeroDecimal = code === 'JPY';
  const decimals = isZeroDecimal ? 0 : (showDecimals ? 2 : 0);

  const formattedNum = absNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
};

/**
 * Derives presentation details for a transaction with multi-currency awareness.
 * Respects backend-provided displayAmount/displayCurrency when present.
 * Preserves original amount & currency.
 * If original currency differs from display currency, presents both clearly.
 * Gracefully falls back to original amount/currency if no converted value is available.
 *
 * @param {object} tx - Transaction document or object
 * @param {string} activeDisplayCurrency - Active user display currency
 * @returns {object} { displayAmount, displayCurrency, originalAmount, originalCurrency, isDifferentCurrency, primaryText, secondaryText, fullText }
 */
export const getTransactionCurrencyDisplay = (tx, activeDisplayCurrency = 'INR') => {
  if (!tx) {
    const cur = (activeDisplayCurrency || 'INR').toUpperCase().trim();
    return {
      displayAmount: 0,
      displayCurrency: cur,
      originalAmount: 0,
      originalCurrency: cur,
      isDifferentCurrency: false,
      primaryText: formatCurrency(0, cur, cur !== 'JPY'),
      secondaryText: null,
      fullText: formatCurrency(0, cur, cur !== 'JPY'),
    };
  }

  const origAmount = Number(tx.amount) || 0;
  const origCurrency = (tx.currency || 'INR').toUpperCase().trim();
  const displayCur = (activeDisplayCurrency || 'INR').toUpperCase().trim();

  let dispAmount = null;
  let dispCurrency = displayCur;

  if (
    tx.displayAmount !== undefined &&
    tx.displayAmount !== null &&
    (!tx.displayCurrency || tx.displayCurrency.toUpperCase().trim() === displayCur)
  ) {
    dispAmount = Number(tx.displayAmount);
    dispCurrency = displayCur;
  } else if (origCurrency === displayCur) {
    dispAmount = origAmount;
    dispCurrency = origCurrency;
  } else if (displayCur === 'USD' && tx.baseAmountUSD !== undefined && tx.baseAmountUSD !== null) {
    dispAmount = Number(tx.baseAmountUSD);
    dispCurrency = 'USD';
  } else {
    // Backward compatibility fallback: preserve original amount and original currency
    dispAmount = origAmount;
    dispCurrency = origCurrency;
  }

  const isDifferentCurrency = origCurrency !== dispCurrency;
  const showDecimals = dispCurrency !== 'JPY';
  const primaryText = formatCurrency(dispAmount, dispCurrency, showDecimals);

  let secondaryText = null;
  if (isDifferentCurrency) {
    const origDecimals = origCurrency !== 'JPY' && (origAmount % 1 !== 0);
    const formattedOrig = formatCurrency(origAmount, origCurrency, origDecimals);
    secondaryText = `(orig. ${formattedOrig})`;
  }

  return {
    displayAmount: dispAmount,
    displayCurrency: dispCurrency,
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
  if (!budget) {
    const cur = (activeDisplayCurrency || 'INR').toUpperCase().trim();
    return {
      displayAmount: 0,
      displayCurrency: cur,
      originalAmount: 0,
      originalCurrency: cur,
      isDifferentCurrency: false,
      primaryText: formatCurrency(0, cur, cur !== 'JPY'),
      secondaryText: null,
      fullText: formatCurrency(0, cur, cur !== 'JPY'),
    };
  }

  const origAmount = Number(budget.totalBudget) || 0;
  const origCurrency = (budget.currency || 'INR').toUpperCase().trim();
  const displayCur = (activeDisplayCurrency || 'INR').toUpperCase().trim();

  let dispAmount = origAmount;
  let dispCurrency = origCurrency;

  if (
    budget.displayTotalBudget !== undefined &&
    budget.displayTotalBudget !== null &&
    (!budget.displayCurrency || budget.displayCurrency.toUpperCase().trim() === displayCur)
  ) {
    dispAmount = Number(budget.displayTotalBudget);
    dispCurrency = displayCur;
  } else if (origCurrency === displayCur) {
    dispAmount = origAmount;
    dispCurrency = origCurrency;
  } else if (displayCur === 'USD' && budget.baseBudgetUSD !== undefined && budget.baseBudgetUSD !== null) {
    dispAmount = Number(budget.baseBudgetUSD);
    dispCurrency = 'USD';
  } else {
    // Backward compatibility fallback: preserve original amount and original currency
    dispAmount = origAmount;
    dispCurrency = origCurrency;
  }

  const isDifferentCurrency = origCurrency !== dispCurrency;
  const showDecimals = dispCurrency !== 'JPY';
  const primaryText = formatCurrency(dispAmount, dispCurrency, showDecimals);

  let secondaryText = null;
  if (isDifferentCurrency) {
    const origDecimals = origCurrency !== 'JPY' && (origAmount % 1 !== 0);
    const formattedOrig = formatCurrency(origAmount, origCurrency, origDecimals);
    secondaryText = `(orig. ${formattedOrig})`;
  }

  return {
    displayAmount: dispAmount,
    displayCurrency: dispCurrency,
    originalAmount: origAmount,
    originalCurrency: origCurrency,
    isDifferentCurrency,
    primaryText,
    secondaryText,
    fullText: secondaryText ? `${primaryText} ${secondaryText}` : primaryText,
  };
};
