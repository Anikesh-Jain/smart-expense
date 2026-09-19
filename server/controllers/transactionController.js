const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { convertCurrency, getExchangeRates, BASELINE_RATES, roundCurrency } = require('../utils/currencyService');

/**
 * Compute baseAmountUSD and historicalRateToUSD for a given amount + currency.
 * Uses live/cached rates when available, falls back to BASELINE_RATES.
 */
async function computeUSDFields(amount, currency) {
  let rates;
  try {
    const rateData = await getExchangeRates();
    rates = rateData.rates || BASELINE_RATES;
  } catch {
    rates = BASELINE_RATES;
  }
  const cur = (currency || 'INR').toUpperCase();
  const historicalRateToUSD = rates[cur] || BASELINE_RATES[cur] || 1.0;
  const baseAmountUSD = convertCurrency(amount, cur, 'USD', rates);
  return { baseAmountUSD, historicalRateToUSD };
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
 * Decorate a transaction object with display currency conversions without mutating stored database values.
 */
function decorateTransactionWithDisplay(tx, displayCurrency, rates) {
  if (!tx) return null;
  const txObj = tx && tx.toObject ? tx.toObject() : { ...tx };
  const txCur = (txObj.currency || 'INR').toUpperCase().trim();
  const numAmount = Number(txObj.amount) || 0;
  const targetCur = (displayCurrency || 'INR').toUpperCase().trim();

  let displayAmount;
  if (txCur === targetCur) {
    displayAmount = numAmount;
  } else if (targetCur === 'USD' && txObj.baseAmountUSD !== undefined && txObj.baseAmountUSD !== null) {
    displayAmount = Number(txObj.baseAmountUSD);
  } else {
    displayAmount = roundCurrency(
      convertCurrency(numAmount, txCur, targetCur, rates),
      targetCur
    );
  }

  return {
    ...txObj,
    displayAmount,
    displayCurrency: targetCur
  };
}

// @desc    Get all transactions with filtering, searching, sorting, pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    // Base query: scoped to current user
    const query = { user: req.user._id };

    // Filter by type (income/expense)
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day to include the entire endDate
        const end = new Date(endDate);
        if (!endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        query.date.$lte = end;
      }
    }

    // Search in description (case-insensitive)
    if (search && search.trim()) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    // Sorting
    let sortOption = { date: -1, createdAt: -1 }; // default: newest first
    if (sort) {
      if (sort === 'date:asc' || sort === 'date') {
        sortOption = { date: 1 };
      } else if (sort === 'date:desc' || sort === '-date') {
        sortOption = { date: -1 };
      } else if (sort === 'amount:asc' || sort === 'amount') {
        sortOption = { amount: 1 };
      } else if (sort === 'amount:desc' || sort === '-amount') {
        sortOption = { amount: -1 };
      } else if (sort.startsWith('-')) {
        sortOption = { [sort.substring(1)]: -1 };
      } else {
        sortOption = { [sort]: 1 };
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Get active exchange rates and display currency for user
    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);

    // Execute queries in parallel for efficiency
    const [totalCount, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    const decoratedTransactions = transactions.map((tx) =>
      decorateTransactionWithDisplay(tx, displayCurrency, rates)
    );

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: decoratedTransactions.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalCount
      },
      data: decoratedTransactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);
    const decorated = decorateTransactionWithDisplay(transaction, displayCurrency, rates);

    res.status(200).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date, currency } = req.body;

    // Determine transaction currency: use provided currency, or fall back to user's current currency
    let txnCurrency = currency;
    if (!txnCurrency) {
      const user = await User.findById(req.user._id).lean();
      txnCurrency = (user && user.currency) || 'INR';
    }
    txnCurrency = txnCurrency.toUpperCase().trim();

    const numAmount = Number(amount);

    // Compute USD conversion fields via currencyService
    const { baseAmountUSD, historicalRateToUSD } = await computeUSDFields(numAmount, txnCurrency);

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: numAmount,
      category: category.trim(),
      description: description ? description.trim() : '',
      date: date ? new Date(date) : new Date(),
      currency: txnCurrency,
      baseAmountUSD,
      historicalRateToUSD
    });

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);
    const decorated = decorateTransactionWithDisplay(transaction, displayCurrency, rates);

    res.status(201).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const { type, amount, category, description, date, currency } = req.body;

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category !== undefined) transaction.category = category.trim();
    if (description !== undefined) transaction.description = description.trim();
    if (date !== undefined) transaction.date = new Date(date);
    if (currency !== undefined) transaction.currency = currency.toUpperCase().trim();

    // Recalculate USD conversion fields whenever amount or currency changes
    if (amount !== undefined || currency !== undefined) {
      const currentAmount = transaction.amount;
      const currentCurrency = transaction.currency || 'INR';
      const usdFields = await computeUSDFields(currentAmount, currentCurrency);
      transaction.baseAmountUSD = usdFields.baseAmountUSD;
      transaction.historicalRateToUSD = usdFields.historicalRateToUSD;
    }

    await transaction.save();

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);
    const decorated = decorateTransactionWithDisplay(transaction, displayCurrency, rates);

    res.status(200).json({
      success: true,
      data: decorated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Helper to escape values for CSV RFC 4180
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// @desc    Export filtered transactions for current user as CSV
// @route   GET /api/transactions/export
// @access  Private
const exportTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      sort
    } = req.query;

    const query = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        query.date.$lte = end;
      }
    }

    if (search && search.trim()) {
      query.description = { $regex: search.trim(), $options: 'i' };
    }

    let sortOption = { date: -1, createdAt: -1 };
    if (sort) {
      if (sort === 'date:asc' || sort === 'date') {
        sortOption = { date: 1 };
      } else if (sort === 'date:desc' || sort === '-date') {
        sortOption = { date: -1 };
      } else if (sort === 'amount:asc' || sort === 'amount') {
        sortOption = { amount: 1 };
      } else if (sort === 'amount:desc' || sort === '-amount') {
        sortOption = { amount: -1 };
      } else if (sort.startsWith('-')) {
        sortOption = { [sort.substring(1)]: -1 };
      } else {
        sortOption = { [sort]: 1 };
      }
    }

    const { rates, displayCurrency } = await getRatesAndDisplayCurrency(req.user, req.query.displayCurrency);

    // Fetch transactions scoped strictly to logged-in user without pagination limit (capped at safe 5000 max)
    const transactions = await Transaction.find(query)
      .sort(sortOption)
      .limit(5000)
      .lean();

    const headers = [
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Display Amount',
      'Category',
      'Description'
    ];

    const rows = transactions.map((tx) => {
      const decorated = decorateTransactionWithDisplay(tx, displayCurrency, rates);
      const dateStr = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';
      const amountStr = Number(tx.amount || 0).toFixed(tx.currency === 'JPY' ? 0 : 2);
      const displayAmountStr = Number(decorated.displayAmount || 0).toFixed(displayCurrency === 'JPY' ? 0 : 2);

      return [
        escapeCSV(dateStr),
        escapeCSV(tx.type || ''),
        escapeCSV(amountStr),
        escapeCSV(tx.currency || 'INR'),
        escapeCSV(displayAmountStr),
        escapeCSV(tx.category || ''),
        escapeCSV(tx.description || '')
      ].join(',');
    });

    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${timestamp}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions
};
