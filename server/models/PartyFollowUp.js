const mongoose = require('mongoose');

const partyFollowUpSchema = new mongoose.Schema({
    partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
    partyName: { type: String, required: true },
    meetingDateTime: { type: Date, required: true },
    remarks: { type: String, required: true },
    flag: {
        type: String,
        enum: ['neutral', 'positive', 'negative'],
        default: 'neutral'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Optional reference
    createdByName: { type: String },
    createdByRole: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PartyFollowUp', partyFollowUpSchema);
