const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    senderModel: {
        type: String,
        enum: ['User', 'Employee'],
        required: true
    },
    receiverModel: {
        type: String,
        enum: ['User', 'Employee'],
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient conversation queries
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
