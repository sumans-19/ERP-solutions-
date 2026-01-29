const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    gstin: { type: String },
    phone: { type: String },

    // Billing Details
    billingAddress: { type: String },
    billingCity: { type: String },
    billingState: { type: String },
    billingPincode: { type: String },

    // Shipping Details
    shippingAddress: { type: String },
    shippingCity: { type: String },
    shippingState: { type: String },
    shippingPincode: { type: String },

    // Codes
    vendorCode: { type: String },
    customerCode: { type: String },

    // Contact Details (Multiple)
    contactNames: [{ type: String }],
    phoneNumbers: [{ type: String }],
    emails: [{ type: String }],

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
