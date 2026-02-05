const mongoose = require('mongoose');

const finishedGoodSchema = new mongoose.Schema({
    partNo: {
        type: String,
        required: true
    },
    partName: String,
    qty: {
        type: Number,
        required: true
    },
    mfgDate: Date,
    expDate: Date,
    poNo: String,
    invoiceNo: String,
    jobNo: String,   // Traceability
    batchCode: String, // Traceability
    initialQty: Number, // Original Job Quantity

    // Recovery Tracking
    sourceJobNo: String,
    rejectionId: String,
    recoveryRef: String,
    isRecovered: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['In Stock', 'In Documentation', 'Invoiced', 'Packed', 'Dispatched'],
        default: 'In Stock'
    },
    currentStageRef: {
        type: String, // ID of Invoice or Packing Slip
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FinishedGood', finishedGoodSchema);
