const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    jobNo: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['Pending', 'Processing', 'Quality Check', 'Done'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
