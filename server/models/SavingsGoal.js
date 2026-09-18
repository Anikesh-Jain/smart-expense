const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    required: true,
    default: 'INR',
    uppercase: true
  },
  convertedAmountToGoalCurrency: { type: Number, required: true },
  exchangeRate: { type: Number, required: true, default: 1.0 },
  rateTimestamp: { type: Date, default: Date.now },
  rateProvider: { type: String, default: 'live' },
  date: { type: Date, default: Date.now }
}, { _id: true });

const savingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
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
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be at least 1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  contributions: [contributionSchema],
  targetDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: 'Status must be active, completed, or cancelled'
    },
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
