const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    businessName: { type: String, default: 'Elints OMS' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    gstEnabled: { type: Boolean, default: true },
    gstRate: { type: Number, default: 18 },
    defaultCurrency: { type: String, default: 'INR' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    emailNotifications: { type: Boolean, default: true },
    systemLogs: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
