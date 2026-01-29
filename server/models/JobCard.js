const mongoose = require('mongoose');

const jobCardSchema = new mongoose.Schema({
    jobNumber: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priority: {
        type: String,
        default: 'Normal'
    },
    deliveryDate: Date,
    status: {
        type: String,
        enum: ['Created', 'InProgress', 'Completed', 'OnHold'],
        default: 'Created'
    },
    steps: [{
        stepId: Number, // Reference to manufacturingSteps id in Order/Item
        stepName: String,
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        targetStartDate: Date,
        targetDeadline: Date,
        status: {
            type: String,
            default: 'pending'
        },
        startTime: Date,
        endTime: Date,
        subSteps: [{
            id: Number,
            name: String,
            description: String,
            status: {
                type: String,
                enum: ['pending', 'completed'],
                default: 'pending'
            }
        }]
    }],
    // Enhanced Stage Management
    stage: {
        type: String,
        enum: ['New', 'Assigned', 'Manufacturing', 'Verification', 'Documentation', 'Completed', 'Hold'],
        default: 'New',
        index: true
    },
    stageHistory: [{
        stage: String,
        changedAt: { type: Date, default: Date.now },
        description: String
    }]
}, { timestamps: true });

// Indexing for performance
jobCardSchema.index({ orderId: 1 });
jobCardSchema.index({ itemId: 1 });
jobCardSchema.index({ status: 1 });
jobCardSchema.index({ stage: 1 });

// Method to calculate stage based on progress
jobCardSchema.methods.calculateStage = function () {
    if (this.status === 'OnHold') return 'Hold';

    // Check assignments
    const assignedSteps = this.steps.filter(s => s.employeeId);
    if (assignedSteps.length === 0) return 'New';

    // Check progress
    const inProgressSteps = this.steps.filter(s => s.status === 'in-progress');
    const completedSteps = this.steps.filter(s => s.status === 'completed');

    // New: No assignment (handled above)
    // Assigned: Steps assigned, none started
    if (inProgressSteps.length === 0 && completedSteps.length === 0) return 'Assigned';

    // Manufacturing: Work started
    // If all steps are completed, move to Verification (or next logic)
    if (completedSteps.length === this.steps.length) {
        // If we are already in Verification, Documentation or Completed, don't revert automatically
        // unless explicitly handled. For now, assume Completed if all steps done.
        // But to fit the UI flow, let's allow manual transition or basic logic.
        if (this.stage === 'Verification' || this.stage === 'Documentation' || this.stage === 'Completed') {
            return this.stage;
        }
        return 'Verification'; // Default next step after MFG
    }

    return 'Manufacturing';
};

jobCardSchema.pre('save', async function () {
    if (this.isModified('steps') || this.isModified('status')) {
        const newStage = this.calculateStage();
        if (newStage !== this.stage) {
            this.stage = newStage;
            this.stageHistory.push({
                stage: newStage,
                description: `Auto-transition to ${newStage}`
            });
        }
    }
});

module.exports = mongoose.model('JobCard', jobCardSchema);
