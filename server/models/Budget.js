const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Budget amount cannot be negative']
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  currency: {
    type: String,
    enum: {
      values: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
      message: 'Currency must be one of INR, USD, EUR, GBP, CAD, AUD, JPY'
    },
    default: 'INR',
    uppercase: true,
    trim: true
  },
  baseBudgetUSD: {
    type: Number
  },
  categoryBudgets: [categoryBudgetSchema]
}, {
  timestamps: true
});

// One budget per user per month/year combination
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

const { BASELINE_RATES } = require('../utils/currencyService');

// Default baseBudgetUSD if not explicitly provided
budgetSchema.pre('save', function (next) {
  if (this.baseBudgetUSD === undefined || this.baseBudgetUSD === null) {
    const cur = (this.currency || 'INR').toUpperCase().trim();
    const rate = BASELINE_RATES[cur] || 1.0;
    this.baseBudgetUSD = cur === 'USD' ? this.totalBudget : (this.totalBudget / rate);
  }
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
