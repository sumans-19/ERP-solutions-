const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Order', 'Job', 'Inventory', 'System'],
        required: true
    },
    action: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
        partyName: String,
        jobNumber: String,
        poNumber: String,
        itemName: String,
        stage: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for fast retrieval of latest activities
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
