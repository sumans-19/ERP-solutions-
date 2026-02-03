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
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party'
    },
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
        hsn: {
            type: String,
            match: [/^\d{0,8}$/, 'HSN must be numeric and max 8 digits']
        },
        gstRate: Number,
        batchCode: String,
        mfgDate: Date,
        expDate: Date,
        remarks: String
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
