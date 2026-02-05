const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNo: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    customerName: String,
    items: [{
        fgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FinishedGood'
        },
        partNo: String,
        partName: String,
        qty: Number,
        lotNumber: String,
        jobNo: String,      // Traceability from FG
        rejectionId: String // Traceability from Customer Rejection
    }],
    lotDetails: [{
        lotNumber: {
            type: String,
            required: true
        },
        sourceRef: String, // JobNo or RejectionId
        qty: Number
    }],
    shipmentMode: String,
    totalQty: Number,
    status: {
        type: String,
        enum: ['Draft', 'Confirmed', 'Packed', 'Dispatched'],
        default: 'Draft'
    },
    remarks: String,
    invoiceDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
