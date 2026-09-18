const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  getBudgets,
  getCurrentBudget,
  createBudget,
  getBudgetById,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

const router = express.Router();

// Protect all budget routes
router.use(protect);

// @route   GET /api/budgets/current (must be before /:id route)
router.get('/current', getCurrentBudget);

// @route   GET /api/budgets
// @route   POST /api/budgets
router.route('/')
  .get(getBudgets)
  .post([
    body('month')
      .notEmpty().withMessage('Month is required')
      .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year')
      .notEmpty().withMessage('Year is required')
      .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
    body('totalBudget')
      .notEmpty().withMessage('Total budget is required')
      .isFloat({ min: 0 }).withMessage('Total budget must be a positive number'),
    body('categoryBudgets')
      .optional()
      .isArray().withMessage('Category budgets must be an array'),
    body('categoryBudgets.*.category')
      .optional()
      .trim()
      .notEmpty().withMessage('Category name is required in category budget'),
    body('categoryBudgets.*.amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Category budget amount must be a positive number'),
    validate
  ], createBudget);

// @route   GET /api/budgets/:id
// @route   PUT /api/budgets/:id
// @route   DELETE /api/budgets/:id
router.route('/:id')
  .get([
    param('id').isMongoId().withMessage('Invalid budget ID'),
    validate
  ], getBudgetById)
  .put([
    param('id').isMongoId().withMessage('Invalid budget ID'),
    body('month')
      .optional()
      .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year')
      .optional()
      .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
    body('totalBudget')
      .optional()
      .isFloat({ min: 0 }).withMessage('Total budget must be a positive number'),
    body('categoryBudgets')
      .optional()
      .isArray().withMessage('Category budgets must be an array'),
    body('categoryBudgets.*.category')
      .optional()
      .trim()
      .notEmpty().withMessage('Category name is required in category budget'),
    body('categoryBudgets.*.amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Category budget amount must be a positive number'),
    validate
  ], updateBudget)
  .delete([
    param('id').isMongoId().withMessage('Invalid budget ID'),
    validate
  ], deleteBudget);

module.exports = router;
