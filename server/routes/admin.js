const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getOverviewStats,
  getUsers,
  deleteUserByAdmin,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus
} = require('../controllers/adminController');

const router = express.Router();

// Strict authorization: all admin routes require valid JWT AND admin role
router.use(protect);
router.use(adminOnly);

// System overview stats
router.get('/overview', getOverviewStats);

// User administration
router.get('/users', getUsers);
router.delete('/users/:id', deleteUserByAdmin);

// Feedback administration
router.get('/feedback', getAllFeedback);
router.get('/feedback/:id', getFeedbackById);
router.patch('/feedback/:id', updateFeedbackStatus);

module.exports = router;
