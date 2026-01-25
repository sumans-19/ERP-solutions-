const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  // In a real relational setup, these would be ObjectIds referencing Task/Item models.
  // For now, we keep them as arrays of ObjectIds to satisfy the requirement
  // "tasks (Array of ObjectId refs)" but we might not have the other models yet.
  // We will define them as generic Schema.Types.ObjectId for now.
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
