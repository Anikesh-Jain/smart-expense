const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// All feedback routes require authentication
router.use(protect);

router.post('/', [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters long')
    .isLength({ max: 3000 }).withMessage('Message cannot exceed 3000 characters'),
  body('category')
    .optional()
    .isIn(['feedback', 'bug', 'feature', 'ui']).withMessage('Invalid category'),
  validate
], submitFeedback);

router.get('/my', getMyFeedback);

module.exports = router;
