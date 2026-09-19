const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } = require('../utils/helpers');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { convertCurrency, getExchangeRates, BASELINE_RATES, roundCurrency } = require('../utils/currencyService');

/**
 * Generate a signed JWT for a user ID.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

/**
 * Decorate user object with display converted baseline financial figures
 */
async function decorateUserWithDisplay(user) {
  if (!user) return null;
  const userObj = user && user.toObject ? user.toObject() : { ...user };
  let rates;
  try {
    const rateData = await getExchangeRates();
    rates = rateData.rates || BASELINE_RATES;
  } catch {
    rates = BASELINE_RATES;
  }

  const profileBaseCurrency = (userObj.profileBaseCurrency || 'INR').toUpperCase().trim();
  const displayCurrency = (userObj.currency || 'INR').toUpperCase().trim();

  const rawIncome = Number(userObj.monthlyIncome) || 0;
  const rawFixed = Number(userObj.fixedExpenses) || 0;
  const rawSavings = Number(userObj.savingsTarget) || 0;

  const displayMonthlyIncome = roundCurrency(
    convertCurrency(rawIncome, profileBaseCurrency, displayCurrency, rates),
    displayCurrency
  );
  const displayFixedExpenses = roundCurrency(
    convertCurrency(rawFixed, profileBaseCurrency, displayCurrency, rates),
    displayCurrency
  );
  const displaySavingsTarget = roundCurrency(
    convertCurrency(rawSavings, profileBaseCurrency, displayCurrency, rates),
    displayCurrency
  );

  return {
    ...userObj,
    displayMonthlyIncome,
    displayFixedExpenses,
    displaySavingsTarget,
    displayCurrency
  };
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Seed default categories for the new user
    const defaultCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
        user: user._id,
        name: cat.name,
        type: 'expense',
        icon: cat.icon,
        isDefault: true
      })),
      ...DEFAULT_INCOME_CATEGORIES.map(cat => ({
        user: user._id,
        name: cat.name,
        type: 'income',
        icon: cat.icon,
        isDefault: true
      }))
    ];

    await Category.insertMany(defaultCategories);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const decoratedUser = await decorateUserWithDisplay(req.user);
    res.json({
      success: true,
      data: decoratedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile and financial setup
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    // Allow profileBaseCurrency so baseline financial inputs preserve their native currency
    const allowedFields = [
      'name', 'currency', 'profileBaseCurrency', 'monthlyIncome', 'fixedExpenses',
      'savingsTarget', 'incomeDay', 'onboardingCompleted'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const decoratedUser = await decorateUserWithDisplay(user);

    res.json({
      success: true,
      data: decoratedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const genericMessage =
      'If an account exists with that email address, password reset instructions have been sent.';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Do not reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage
      });
    }

    // Generate and store hashed reset token
    const rawToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL using CLIENT_URL and raw token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    // Dispatch password reset email safely
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl
      });
    } catch (emailError) {
      // Log generic failure without leaking credentials or raw token
      console.error('Password reset email dispatch error:', emailError.message);
    }

    // Never expose the token in API response, do not log raw token/password
    res.status(200).json({
      success: true,
      message: genericMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using valid token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token;
    const { password } = req.body;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token from the request to compare against stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password
    user.password = password;
    // Invalidate reset token to prevent reuse
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout,
  forgotPassword,
  resetPassword
};

