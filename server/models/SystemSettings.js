const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    businessName: { type: String, default: 'Elints OMS' },
    companyLogo: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    pan: { type: String, default: '' },
    tan: { type: String, default: '' },
    website: { type: String, default: '' },
    gstEnabled: { type: Boolean, default: true },
    gstNumber: { type: String, default: '' },
    gstRate: { type: Number, default: 18 },
    defaultCurrency: { type: String, default: 'INR' },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    emailNotifications: { type: Boolean, default: true },
    systemLogs: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
