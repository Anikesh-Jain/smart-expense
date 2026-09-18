const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    },
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
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
  baseAmountUSD: {
    type: Number
  },
  historicalRateToUSD: {
    type: Number,
    default: 1.0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
// Default baseAmountUSD if not explicitly provided
transactionSchema.pre('save', function (next) {
  if (this.baseAmountUSD === undefined || this.baseAmountUSD === null) {
    const cur = this.currency || 'INR';
    const rate = this.historicalRateToUSD || (cur === 'USD' ? 1.0 : (cur === 'INR' ? 96.0 : 1.0));
    this.baseAmountUSD = cur === 'USD' ? this.amount : (this.amount / rate);
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
