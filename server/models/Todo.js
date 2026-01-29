const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    taskName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    deadlineDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Reference to Employee model
    assignmentName: { type: String }, // Store name for easier display
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', todoSchema);
