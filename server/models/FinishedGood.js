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
    initialQty: Number // Original Job Quantity
}, {
    timestamps: true
});

module.exports = mongoose.model('FinishedGood', finishedGoodSchema);
