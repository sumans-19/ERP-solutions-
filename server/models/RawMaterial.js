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
    thickness: String,
    finish: String,
    colour: String,
    type: String,
    size: String,
    expDate: Date,
    qty: {
        type: Number,
        default: 0
    },
    uom: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
