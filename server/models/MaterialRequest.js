const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemCode: String,
    itemName: String,
    description: String,
    thickness: String,
    finish: String,
    colour: String,
    type: String,
    size: String,
    expDate: Date,
    qty: Number,
    uom: String
}, { _id: false }); // Disable _id for subdocs if not needed, or keep it. Let's keep it simple.

const materialRequestSchema = new mongoose.Schema({
    mrNo: {
        type: String,
        required: true,
        unique: true
    },
    items: [itemSchema],
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'],
        default: 'Pending'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    requestDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
