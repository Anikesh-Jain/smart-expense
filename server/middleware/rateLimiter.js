const rateLimit = require('express-rate-limit');

/**
 * Clean JSON error handler for rate limit violations
 */
const createLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message
  });
};

/**
 * Rate limiter for login requests
 * 20 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many login attempts from this IP. Please try again after 15 minutes.'),
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter for account registrations
 * 20 registrations per 1 hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many account registration attempts from this IP. Please try again after an hour.'),
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter for forgot password requests
 * 10 reset emails per 15 minutes per IP
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many password reset requests from this IP. Please try again after 15 minutes.'),
  skip: () => process.env.NODE_ENV === 'test'
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter
};
