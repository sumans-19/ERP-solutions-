const mongoose = require('mongoose');

const wipStockSchema = new mongoose.Schema({
    jobNo: {
        type: String,
        required: true
    },
    partNo: {
        type: String,
        required: true
    },
    partName: String,
    thickness: String,
    qty: {
        type: Number,
        required: true
    },
    initialQty: Number,      // Original Job Total
    processedQty: Number,    // Cumulative Processed across steps
    rejectedQty: Number,     // Cumulative Rejected across steps
    rmConsumed: String,      // Summary of RM used (e.g., "200 SqMtr of Material X")
    currentStage: String,    // Current Step Name
    uom: String,
    batchCode: String,
    poNo: String
}, {
    timestamps: true
});

module.exports = mongoose.model('WIPStock', wipStockSchema);
