const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
