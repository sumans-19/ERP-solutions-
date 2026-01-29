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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WIPStock', wipStockSchema);
