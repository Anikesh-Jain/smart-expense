const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions
} = require('../controllers/transactionController');

const router = express.Router();

// Protect all transaction routes
router.use(protect);

// @route   GET /api/transactions/export (must be before /:id)
router.get('/export', exportTransactions);

// @route   GET /api/transactions
// @route   POST /api/transactions
router.route('/')
  .get(getTransactions)
  .post([
    body('type')
      .notEmpty().withMessage('Transaction type is required')
      .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Please provide a valid ISO date'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    validate
  ], createTransaction);

// @route   GET /api/transactions/:id
// @route   PUT /api/transactions/:id
// @route   DELETE /api/transactions/:id
router.route('/:id')
  .get([
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate
  ], getTransaction)
  .put([
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('type')
      .optional()
      .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category')
      .optional()
      .trim()
      .notEmpty().withMessage('Category cannot be empty'),
    body('date')
      .optional()
      .isISO8601().withMessage('Please provide a valid ISO date'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    validate
  ], updateTransaction)
  .delete([
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate
  ], deleteTransaction);

module.exports = router;
