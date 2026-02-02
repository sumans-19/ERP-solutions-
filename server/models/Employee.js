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
        jobCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
        processName: String,
        assignedAt: Date
    }],

    // Calculated status based on workload
    calculatedStatus: {
        type: String,
        enum: ['Available', 'Busy'],
        default: 'Available'
    },

    // Individual Permissions (Overrides role-based if present)
    individualPermissions: [{
        section: String,
        visibility: { type: Boolean, default: true },
        actions: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        }
    }],

    // Work Shift / Time Settings
    workShift: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '18:00' },
        breakTime: { type: String, default: '13:00' }
    },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', employeeSchema);
