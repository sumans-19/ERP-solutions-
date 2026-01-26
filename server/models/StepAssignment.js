const mongoose = require('mongoose');

const stepAssignmentSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    processStepId: {
        type: Number,
        required: true
    },
    processStepName: {
        type: String,
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['assigned', 'in-progress', 'completed', 'failed'],
        default: 'assigned'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
stepAssignmentSchema.index({ itemId: 1, processStepId: 1 });
stepAssignmentSchema.index({ employeeId: 1, status: 1 });

module.exports = mongoose.model('StepAssignment', stepAssignmentSchema);
