const mongoose = require('mongoose');

const packingSlipSchema = new mongoose.Schema({
    packingSlipNo: {
        type: String,
        required: true,
        unique: true
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    invoiceNo: String,
    boxes: [{
        boxNumber: Number,
        totalBoxes: Number,
        capacity: Number,
        lots: [{
            lotNumber: String,
            qty: Number,
            jobNo: String,
            rejectionId: String
        }],
        totalQty: Number
    }],
    totalQty: Number,
    totalBoxes: Number,
    status: {
        type: String,
        enum: ['Draft', 'Confirmed', 'Dispatched'],
        default: 'Draft'
    },
    dispatchDetails: {
        vehicleNo: String,
        driverName: String,
        contactNo: String,
        remarks: String,
        dispatchedAt: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PackingSlip', packingSlipSchema);
