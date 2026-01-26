const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    gstin: { type: String },
    phone: { type: String },

    // GST & Address Tab
    billingAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // Credit & Balance Tab
    openingBalance: { type: Number, default: 0 },
    balanceType: { type: String, enum: ['toPay', 'toReceive'], default: 'toReceive' },
    creditLimitType: { type: String, enum: ['noLimit', 'custom'], default: 'noLimit' },
    customCreditLimit: { type: Number },
    currentBalance: { type: Number, default: 0 },

    // Initial Purchase Order (optional)
    initialOrder: {
        orderNumber: String,
        totalItems: Number,
        ratePerItem: Number,
        description: String
    },

    // Additional Fields (dynamic)
    additionalFields: [{
        key: String,
        value: String
    }],

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Party', partySchema);
