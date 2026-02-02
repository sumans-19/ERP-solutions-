const mongoose = require('mongoose');

const grnSchema = new mongoose.Schema({
    grnNumber: {
        type: String,
        required: true,
        unique: true
    },
    invoiceNo: String,
    invoiceDate: Date,
    poNo: String,
    supplierName: String,
    supplierCode: String,
    modeOfTransport: String,
    iqcStatus: {
        type: String,
        enum: ['OK', 'NOT OK'],
        default: 'OK'
    },
    items: [{
        itemCode: String,
        itemName: String,
        qty: Number,
        uom: String,
        costPerUnit: Number,
        hsn: String,
        gstRate: Number,
        batchCode: String,
        mfgDate: Date,
        expDate: Date
    }],
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    receivedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GRN', grnSchema);
