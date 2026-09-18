const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  getSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToGoal
} = require('../controllers/savingsController');

const router = express.Router();

// Protect all savings goal routes
router.use(protect);

// @route   GET /api/savings-goals
// @route   POST /api/savings-goals
router.route('/')
  .get(getSavingsGoals)
  .post([
    body('title')
      .trim()
      .notEmpty().withMessage('Goal title is required')
      .isLength({ max: 100 }).withMessage('Goal title cannot exceed 100 characters'),
    body('targetAmount')
      .notEmpty().withMessage('Target amount is required')
      .isFloat({ min: 1 }).withMessage('Target amount must be at least 1'),
    body('currentAmount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Current amount cannot be negative'),
    body('targetDate')
      .optional()
      .isISO8601().withMessage('Please provide a valid ISO target date'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    validate
  ], createSavingsGoal);

// @route   PUT /api/savings-goals/:id/contribute (must be before or handled cleanly alongside /:id)
router.put('/:id/contribute', [
  param('id').isMongoId().withMessage('Invalid savings goal ID'),
  body('amount')
    .notEmpty().withMessage('Contribution amount is required')
    .isFloat({ min: 0.01 }).withMessage('Contribution amount must be greater than 0'),
  validate
], contributeToGoal);

// @route   GET /api/savings-goals/:id
// @route   PUT /api/savings-goals/:id
// @route   DELETE /api/savings-goals/:id
router.route('/:id')
  .get([
    param('id').isMongoId().withMessage('Invalid savings goal ID'),
    validate
  ], getSavingsGoal)
  .put([
    param('id').isMongoId().withMessage('Invalid savings goal ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty().withMessage('Goal title cannot be empty')
      .isLength({ max: 100 }).withMessage('Goal title cannot exceed 100 characters'),
    body('targetAmount')
      .optional()
      .isFloat({ min: 1 }).withMessage('Target amount must be at least 1'),
    body('currentAmount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Current amount cannot be negative'),
    body('targetDate')
      .optional()
      .isISO8601().withMessage('Please provide a valid ISO target date'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled']).withMessage('Status must be active, completed, or cancelled'),
    validate
  ], updateSavingsGoal)
  .delete([
    param('id').isMongoId().withMessage('Invalid savings goal ID'),
    validate
  ], deleteSavingsGoal);

module.exports = router;
