const mongoose = require('mongoose');

const rejectedGoodSchema = new mongoose.Schema({
    rejectionId: {
        type: String,
        index: true
    },
    // Item Linkage
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    partNo: {
        type: String,
        required: true
    },
    partName: String,

    // Quantity
    qty: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative']
    },

    // Source Tracking
    source: {
        type: String,
        enum: ['Production', 'Manual', 'QC'],
        required: true,
        default: 'Manual'
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobCard'
    },
    jobNo: String,
    stepName: String,
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    employeeName: String,

    // Metadata
    rejectionDate: {
        type: Date,
        default: Date.now
    },
    mfgDate: Date,
    poNo: String,
    invoiceNo: String,
    reason: {
        type: String,
        required: true
    },

    // Workflow Status
    status: {
        type: String,
        enum: ['Pending', 'Hold', 'Scrapped', 'Recovered'],
        default: 'Pending'
    },

    // Disposition Details
    recoveryDetails: {
        recoveredQty: Number,
        targetBatchNumber: String,
        date: Date,
        remarks: String,
        recoveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    scrapDetails: {
        scrappedQty: Number,
        date: Date,
        remarks: String,
        scrappedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    holdDetails: {
        date: Date,
        remarks: String,
        heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RejectedGood', rejectedGoodSchema);
