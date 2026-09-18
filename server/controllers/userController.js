const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Category = require('../models/Category');
const Feedback = require('../models/Feedback');

/**
 * Safely cascades deletion of all resources owned by a given user
 * Ensures no orphaned personal financial data or personal feedback persists
 */
const cascadeDeleteUser = async (userId) => {
  const [
    txnsDeleted,
    budgetsDeleted,
    goalsDeleted,
    catsDeleted,
    feedbacksDeleted,
    userDeleted
  ] = await Promise.all([
    Transaction.deleteMany({ user: userId }),
    Budget.deleteMany({ user: userId }),
    SavingsGoal.deleteMany({ user: userId }),
    Category.deleteMany({ user: userId }),
    Feedback.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId)
  ]);

  return {
    transactions: txnsDeleted.deletedCount,
    budgets: budgetsDeleted.deletedCount,
    savingsGoals: goalsDeleted.deletedCount,
    categories: catsDeleted.deletedCount,
    feedbacks: feedbacksDeleted.deletedCount,
    user: !!userDeleted
  };
};

// @desc    Delete current user's account and all associated personal data
// @route   DELETE /api/users/me
// @access  Private (Authenticated User)
exports.deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const summary = await cascadeDeleteUser(userId);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

exports.cascadeDeleteUser = cascadeDeleteUser;
