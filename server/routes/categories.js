const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Protect all category routes
router.use(protect);

// @route   GET /api/categories
// @route   POST /api/categories
router.route('/')
  .get(getCategories)
  .post([
    body('name')
      .trim()
      .notEmpty().withMessage('Category name is required')
      .isLength({ max: 30 }).withMessage('Category name cannot exceed 30 characters'),
    body('type')
      .notEmpty().withMessage('Category type is required')
      .isIn(['income', 'expense']).withMessage('Category type must be either income or expense'),
    body('icon')
      .optional()
      .trim()
      .notEmpty().withMessage('Icon cannot be empty'),
    validate
  ], createCategory);

// @route   PUT /api/categories/:id
// @route   DELETE /api/categories/:id
router.route('/:id')
  .put([
    param('id').isMongoId().withMessage('Invalid category ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('Category name cannot be empty')
      .isLength({ max: 30 }).withMessage('Category name cannot exceed 30 characters'),
    body('icon')
      .optional()
      .trim()
      .notEmpty().withMessage('Icon cannot be empty'),
    validate
  ], updateCategory)
  .delete([
    param('id').isMongoId().withMessage('Invalid category ID'),
    validate
  ], deleteCategory);

module.exports = router;
