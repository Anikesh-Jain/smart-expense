const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * Returns 400 with structured error messages if validation fails.
 * Use after express-validator check chains in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = validate;
