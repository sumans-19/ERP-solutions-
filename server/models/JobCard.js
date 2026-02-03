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
    extraQty: {
        type: Number,
        default: 0
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
        stepId: String,
        stepName: String,
        description: String,
        timeToComplete: String,
        stepType: {
            type: String,
            enum: ['execution', 'testing'],
            default: 'execution'
        },
        // Multiple Employees
        assignedEmployees: [{
            employeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee'
            },
            assignedAt: { type: Date, default: Date.now }
        }],
        isOpenJob: {
            type: Boolean,
            default: false
        },
        // FQC Structured Data
        fqcParameters: [{
            parameterName: String,
            notation: String,
            tolerance: String,
            positiveTolerance: String,
            negativeTolerance: String,
            actualValue: String,
            valueType: String,
            standardValue: String,
            samples: [{
                sampleNumber: Number,
                reading: String
            }],
            remarks: String
        }],
        requiredSamples: {
            type: Number,
            default: 1
        },
        isOutward: {
            type: Boolean,
            default: false
        },
        outwardDetails: {
            partyName: String,
            expectedReturnDate: Date,
            internalEmployeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee'
            }
        },
        // Execution Tracking
        quantities: {
            received: { type: Number, default: 0 },
            processed: { type: Number, default: 0 },
            rejected: { type: Number, default: 0 }
        },
        remarks: String,
        targetStartDate: Date,
        targetDeadline: Date,
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'failed'],
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
    // Final Quality Check Structure (Snapped from Item)
    fqcParameters: [{
        parameterName: String,
        notation: String,
        tolerance: String,
        positiveTolerance: String,
        negativeTolerance: String,
        actualValue: String,
        valueType: String,
        standardValue: String,
        samples: [{
            sampleNumber: Number,
            reading: String
        }],
        remarks: String
    }],
    requiredSamples: {
        type: Number,
        default: 1
    },
    // Final Quality Check Results (Legacy or specifically for summary)
    fqcResults: [{
        parameterId: Number,
        parameterName: String,
        samples: [Number], // Sample 1, 2, 3...
        actualValue: String,
        remarks: String,
        status: {
            type: String,
            enum: ['Passed', 'Failed', 'Pending'],
            default: 'Pending'
        }
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
    }],
    rmRequirements: [{
        name: String,
        required: Number,
        available: Number,
        unit: String,
        itemCode: String,
        code: String
    }],
    rmConsumptionLog: [{
        materialCode: String,
        materialName: String,
        quantityConsumed: Number,
        uom: String,
        consumedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Indexing for performance
jobCardSchema.index({ orderId: 1 });
jobCardSchema.index({ itemId: 1 });
jobCardSchema.index({ status: 1 });


// Method to calculate stage based on progress
jobCardSchema.methods.calculateStage = function () {
    if (this.status === 'OnHold') return 'Hold';

    // Check assignments
    const hasAssignedOrOpen = this.steps.some(s => s.assignedEmployees?.length > 0 || s.isOpenJob);
    if (!hasAssignedOrOpen) return 'New';

    // Check progress
    const inProgressSteps = this.steps.filter(s => s.status === 'in-progress');
    const completedSteps = this.steps.filter(s => s.status === 'completed');

    if (inProgressSteps.length === 0 && completedSteps.length === 0) return 'Assigned';

    if (completedSteps.length === this.steps.length) {
        if (this.stage === 'Verification' || this.stage === 'Documentation' || this.stage === 'Completed') {
            return this.stage;
        }
        return 'Verification';
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
