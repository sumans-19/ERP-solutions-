const mongoose = require('mongoose');

const rejectedGoodSchema = new mongoose.Schema({
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
    poNo: String,
    invoiceNo: String,
    reason: String
}, {
    timestamps: true
});

module.exports = mongoose.model('RejectedGood', rejectedGoodSchema);
