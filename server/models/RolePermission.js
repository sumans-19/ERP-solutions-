const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true }, // 'admin', 'planning', 'employee'
    permissions: [{
        section: String, // 'items', 'orders', 'inventory', 'users', 'reports', 'communication', 'tasks', 'jobs'
        visibility: { type: Boolean, default: true },
        actions: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        }
    }],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
