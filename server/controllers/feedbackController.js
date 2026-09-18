const Feedback = require('../models/Feedback');

// @desc    Submit new user feedback
// @route   POST /api/feedback
// @access  Private (Authenticated users)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { category, subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback subject is required'
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Feedback message must be at least 10 characters long'
      });
    }

    const validCategories = ['feedback', 'bug', 'feature', 'ui'];
    const selectedCategory = category && validCategories.includes(category) ? category : 'feedback';

    const feedback = await Feedback.create({
      user: req.user._id,
      category: selectedCategory,
      subject: subject.trim(),
      message: message.trim(),
      status: 'new'
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own feedback history
// @route   GET /api/feedback/my
// @access  Private (Authenticated users)
exports.getMyFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};
