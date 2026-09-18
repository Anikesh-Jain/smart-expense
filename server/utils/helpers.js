/**
 * Default categories and utility constants for the Expense Tracker.
 */

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍔' },
  { name: 'Mess', icon: '🍽️' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Transport', icon: '🚌' },
  { name: 'College', icon: '🎓' },
  { name: 'Education', icon: '📚' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🎮' },
  { name: 'Recharge', icon: '📱' },
  { name: 'Hostel/Rent', icon: '🏠' },
  { name: 'Bills', icon: '📄' },
  { name: 'Health', icon: '💊' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Emergency', icon: '🚨' },
  { name: 'Other', icon: '📦' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Pocket Money', icon: '💰' },
  { name: 'Salary', icon: '💼' },
  { name: 'Stipend', icon: '🎓' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Scholarship', icon: '🏅' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Other', icon: '📦' }
];

module.exports = {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
};
