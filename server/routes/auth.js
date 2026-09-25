const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/authController');
const { deleteMyAccount } = require('../controllers/userController');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', [
  registerLimiter,
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], register);

// @route   POST /api/auth/login
router.post('/login', [
  loginLimiter,
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
], login);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
router.put('/profile', protect, [
  body('monthlyIncome')
    .optional()
    .isFloat({ min: 0 }).withMessage('Monthly income must be a positive number'),
  body('fixedExpenses')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fixed expenses must be a positive number'),
  body('savingsTarget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Savings target must be a positive number'),
  body('currency')
    .optional()
    .trim()
    .notEmpty().withMessage('Currency cannot be empty'),
  body('incomeDay')
    .optional()
    .isInt({ min: 1, max: 31 }).withMessage('Income day must be between 1 and 31'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  validate
], updateProfile);

// @route   PUT /api/auth/password
router.put('/password', protect, [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], updatePassword);

// @route   POST /api/auth/logout
router.post('/logout', protect, logout);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
  forgotPasswordLimiter,
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  validate
], forgotPassword);

// @route   GET /api/auth/reset-password/:token
router.get('/reset-password/:token', verifyResetToken);

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], resetPassword);

// @route   DELETE /api/auth/me
router.delete('/me', protect, deleteMyAccount);

module.exports = router;
