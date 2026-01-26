const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    // Basic Info
    employeeId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String },

    // Authentication
    password: { type: String }, // For login if needed

    // Role & Status
    role: {
        type: String,
        enum: ['Admin', 'Manager', 'Supervisor', 'Worker', 'QC Inspector', 'Dispatcher', 'Accountant', 'Sales', 'Other'],
        default: 'Worker'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Leave'],
        default: 'Active'
    },

    // Work tracking
    currentAssignments: [{
        orderId: String,
        processName: String,
        assignedAt: Date
    }],

    // Calculated status based on workload
    calculatedStatus: {
        type: String,
        enum: ['Available', 'Busy'],
        default: 'Available'
    },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', employeeSchema);
