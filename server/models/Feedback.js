const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  category: {
    type: String,
    enum: {
      values: ['feedback', 'bug', 'feature', 'ui'],
      message: 'Category must be one of: feedback, bug, feature, ui'
    },
    default: 'feedback',
    trim: true,
    required: [true, 'Category is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [3000, 'Message cannot exceed 3000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['new', 'reviewing', 'resolved', 'closed'],
      message: 'Status must be one of: new, reviewing, resolved, closed'
    },
    default: 'new',
    index: true
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
