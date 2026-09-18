const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Feedback = require('../models/Feedback');
const { cascadeDeleteUser } = require('./userController');

// @desc    Get high-level non-sensitive system overview statistics
// @route   GET /api/admin/overview
// @access  Private (Admin Only)
exports.getOverviewStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      recentUsers,
      totalTransactions,
      totalBudgets,
      totalSavingsGoals,
      totalFeedback,
      unresolvedFeedback
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Transaction.countDocuments(),
      Budget.countDocuments(),
      SavingsGoal.countDocuments(),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: { $in: ['new', 'reviewing'] } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        totalTransactions,
        totalBudgets,
        totalSavingsGoals,
        totalFeedback,
        unresolvedFeedback
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated users list with search & filter
// @route   GET /api/admin/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (req.query.role && ['user', 'admin'].includes(req.query.role)) {
      query.role = req.query.role;
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and cascade all associated data
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
exports.deleteUserByAdmin = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Prevent admin from accidentally deleting their own active account via this route
    if (req.user._id.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account through user management. Use self-deletion instead.'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const summary = await cascadeDeleteUser(targetUserId);

    res.json({
      success: true,
      message: `User ${user.email} and all associated data deleted successfully`,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated feedback list for admin
// @route   GET /api/admin/feedback
// @access  Private (Admin Only)
exports.getAllFeedback = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && ['new', 'reviewing', 'resolved', 'closed'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.category && ['feedback', 'bug', 'feature', 'ui'].includes(req.query.category)) {
      query.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ subject: searchRegex }, { message: searchRegex }];
    }

    const [total, feedbacks] = await Promise.all([
      Feedback.countDocuments(query),
      Feedback.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json({
      success: true,
      count: feedbacks.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single feedback details
// @route   GET /api/admin/feedback/:id
// @access  Private (Admin Only)
exports.getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('user', 'name email role');
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status and/or admin notes
// @route   PATCH /api/admin/feedback/:id
// @access  Private (Admin Only)
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ['new', 'reviewing', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found'
      });
    }

    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes.trim();

    await feedback.save();
    await feedback.populate('user', 'name email role');

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};
