const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'On Hold'], default: 'Pending' },
    processAssignments: [{
        processName: {
            type: String,
            enum: ['New', 'Verify', 'Manufacturing', 'QC Check', 'Documentation', 'Dispatch Prep', 'Dispatch', 'Billing', 'Payment Follow-up', 'Closure'],
            required: true
        },
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        assignedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
