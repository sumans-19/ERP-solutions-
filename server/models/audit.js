const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    jobNo: { type: String, required: true },
    itemName: { type: String, required: true },
    mfgstepName: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['Pending', 'Processing', 'Quality Check', 'Done'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Audit', auditSchema);
