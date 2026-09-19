/**
 * Enterprise Multi-Currency Service
 * 
 * Manages exchange rates, conversions, and dynamic currency formatting.
 * Supported currencies: INR, USD, EUR, GBP, CAD, AUD, JPY.
 */

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  JPY: '¥'
};

const CURRENCY_DECIMALS = {
  JPY: 0,
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2
};

// Resilient fallback baseline exchange rates (USD base = 1.0)
const BASELINE_RATES = {
  USD: 1.0,
  INR: 96.0,
  EUR: 0.92,
  GBP: 0.77,
  CAD: 1.39,
  AUD: 1.54,
  JPY: 152.0
};

// In-memory rate cache
let rateCache = {
  rates: { ...BASELINE_RATES },
  lastUpdated: null,
  provider: 'fallback',
  isFallback: true,
  isStale: true
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch latest exchange rates from open API or environment override
 */
async function fetchExchangeRates() {
  const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const headers = {};
    if (process.env.EXCHANGE_RATE_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.EXCHANGE_RATE_API_KEY}`;
    }

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Exchange rate provider returned status ${response.status}`);
    }

    const data = await response.json();
    const fetchedRates = data.rates || data.conversion_rates;

    if (!fetchedRates || typeof fetchedRates !== 'object') {
      throw new Error('Invalid rate payload structure from provider');
    }

    // Filter to only our supported currencies
    const rates = { USD: 1.0 };
    SUPPORTED_CURRENCIES.forEach((cur) => {
      if (cur === 'USD') return;
      if (typeof fetchedRates[cur] === 'number' && fetchedRates[cur] > 0) {
        rates[cur] = fetchedRates[cur];
      } else {
        rates[cur] = BASELINE_RATES[cur];
      }
    });

    rateCache = {
      rates,
      lastUpdated: new Date().toISOString(),
      provider: 'live',
      isFallback: false,
      isStale: false
    };

    return rateCache;
  } catch (error) {
    // If live fetch fails, check if we have a valid previous cache
    if (rateCache.lastUpdated) {
      return {
        ...rateCache,
        provider: 'cache',
        isStale: true,
        warning: `Live rate fetch failed (${error.message}); utilizing cached rates.`
      };
    }

    // Fall back to baseline rates
    return {
      rates: { ...BASELINE_RATES },
      lastUpdated: new Date().toISOString(),
      provider: 'fallback',
      isFallback: true,
      isStale: true,
      warning: `Live rate fetch failed (${error.message}); utilizing emergency baseline rates.`
    };
  }
}

/**
 * Get current rates (from cache if fresh, otherwise fetches)
 */
async function getExchangeRates() {
  const now = Date.now();
  if (
    rateCache.lastUpdated &&
    !rateCache.isFallback &&
    now - new Date(rateCache.lastUpdated).getTime() < CACHE_TTL_MS
  ) {
    return rateCache;
  }

  return await fetchExchangeRates();
}

/**
 * Synchronous getter for current cached rates
 */
function getCachedRates() {
  return rateCache;
}

/**
 * Convert an amount from one currency to another using high-precision math.
 * Does NOT round early. Returns exact IEEE-754 double precision number.
 * 
 * @param {number} amount - Numeric amount to convert
 * @param {string} fromCur - Source currency code (e.g. 'INR')
 * @param {string} toCur - Target currency code (e.g. 'USD')
 * @param {object} [rates] - Exchange rates relative to USD (defaults to cache)
 * @param {boolean} [shouldRound=false] - Whether to round to currency decimal precision
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCur = 'INR', toCur = 'INR', rates = null, shouldRound = false) {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num) || num === 0) return 0;

  const from = String(fromCur || 'INR').toUpperCase().trim();
  const to = String(toCur || 'INR').toUpperCase().trim();

  if (from === to) {
    return shouldRound ? roundCurrency(num, to) : num;
  }

  const activeRates = rates || rateCache.rates || BASELINE_RATES;
  const fromRate = activeRates[from] || BASELINE_RATES[from] || 1.0;
  const toRate = activeRates[to] || BASELINE_RATES[to] || 1.0;

  // Exact formula: amount in USD = amount / fromRate; amount in toCur = (amount / fromRate) * toRate
  const converted = (num / fromRate) * toRate;
  return shouldRound ? roundCurrency(converted, to) : converted;
}

/**
 * Rounds a monetary amount strictly at the final serialization/presentation boundary.
 * JPY is rounded to 0 decimals, all other supported currencies to 2 decimals.
 */
function roundCurrency(amount, currencyCode = 'INR') {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) return 0;

  const code = String(currencyCode || 'INR').toUpperCase().trim();
  const decimals = CURRENCY_DECIMALS[code] !== undefined ? CURRENCY_DECIMALS[code] : 2;

  if (decimals === 0) {
    return Math.round(num);
  }

  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Returns symbol for currency code
 */
function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return '₹';
  const code = String(currencyCode).toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] || '₹';
}

/**
 * Formats amount dynamically with currency symbol and appropriate decimal digits
 */
function formatCurrency(amount, currencyCode = 'INR', showDecimals = null) {
  const num = Number(amount);
  const symbol = getCurrencySymbol(currencyCode);
  const code = String(currencyCode || 'INR').toUpperCase().trim();
  const defaultDecimals = CURRENCY_DECIMALS[code] !== undefined ? CURRENCY_DECIMALS[code] : 2;
  const useDecimals = showDecimals !== null ? (showDecimals ? 2 : 0) : defaultDecimals;

  if (isNaN(num) || !isFinite(num)) {
    return `${symbol}0`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formattedNum = absNum.toLocaleString('en-US', {
    minimumFractionDigits: useDecimals,
    maximumFractionDigits: useDecimals
  });

  return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
}

module.exports = {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  CURRENCY_DECIMALS,
  BASELINE_RATES,
  fetchExchangeRates,
  getExchangeRates,
  getCachedRates,
  convertCurrency,
  roundCurrency,
  getCurrencySymbol,
  formatCurrency
};
