const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    gstin: { type: String },

    // Address
    billingAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    location: { type: String }, // Calculated or primary location key

    // Financials
    currentBalance: { type: Number, default: 0 },
    paymentType: { type: String, enum: ['toPay', 'toReceive'], default: 'toReceive' },
    creditLimitType: { type: String, enum: ['noLimit', 'custom'], default: 'noLimit' },
    customCreditLimit: { type: Number },

    // Initial Order (Optional)
    initialOrder: {
        orderNumber: String,
        totalItems: Number,
        ratePerItem: Number,
        description: String
    },

    // Dynamic Fields
    additionalFields: [{
        key: String,
        value: String
    }],

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Party', partySchema);
