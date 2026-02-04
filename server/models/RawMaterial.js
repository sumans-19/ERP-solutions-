const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    qty: {
        type: Number,
        default: 0
    },
    uom: {
        type: String,
        required: true,
        trim: true
    },
    hsn: String,
    gstRate: Number,
    consumptionHistory: [{
        jobNumber: String,
        poNumber: String,
        itemName: String,
        quantityConsumed: Number,
        consumedAt: { type: Date, default: Date.now },
        remarks: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
