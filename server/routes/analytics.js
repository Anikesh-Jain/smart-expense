const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  getDashboardOverview,
  getMonthlyTrends,
  getCategoryBreakdown,
  getSpendingPace,
  getWillMoneyLast,
  getFinancialHealthScore,
  getSmartSuggestions,
  postSmartSavingPlan
} = require('../controllers/analyticsController');

const router = express.Router();

// Protect all analytics endpoints
router.use(protect);

// @route   GET /api/analytics/overview
router.get('/overview', getDashboardOverview);

// @route   GET /api/analytics/monthly
router.get('/monthly', [
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24'),
  validate
], getMonthlyTrends);

// @route   GET /api/analytics/categories
router.get('/categories', [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage('Valid year required'),
  query('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  validate
], getCategoryBreakdown);

// @route   GET /api/analytics/spending-pace
router.get('/spending-pace', getSpendingPace);

// @route   GET /api/analytics/money-last
router.get('/money-last', getWillMoneyLast);

// @route   GET /api/analytics/financial-health
router.get('/financial-health', getFinancialHealthScore);

// @route   GET /api/analytics/suggestions
router.get('/suggestions', getSmartSuggestions);

// @route   POST /api/analytics/saving-plan
router.post('/saving-plan', [
  body('targetAmount')
    .notEmpty().withMessage('Target amount is required')
    .isFloat({ min: 1 }).withMessage('Target amount must be at least 1'),
  body('targetDate')
    .notEmpty().withMessage('Target date is required')
    .isISO8601().withMessage('Valid ISO target date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  validate
], postSmartSavingPlan);

module.exports = router;
