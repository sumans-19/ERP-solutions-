const mongoose = require('mongoose');
const RolePermission = require('./models/RolePermission');
require('dotenv').config();

async function fixPermissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const roleName = 'Worker';

        let rolePerm = await RolePermission.findOne({ role: roleName });
        if (!rolePerm) {
            console.log('Creating new role config for Worker');
            rolePerm = new RolePermission({ role: roleName, permissions: [] });
        } else {
            console.log('Found existing role config for Worker');
        }

        // Ensure 'orders' permission exists
        const ordersPermIndex = rolePerm.permissions.findIndex(p => p.section === 'orders');
        if (ordersPermIndex === -1) {
            rolePerm.permissions.push({
                section: 'orders',
                visibility: true,
                actions: { read: true, create: false, update: false, delete: false }
            });
            console.log('Added orders permission');
        } else {
            rolePerm.permissions[ordersPermIndex].visibility = true;
            rolePerm.permissions[ordersPermIndex].actions.read = true;
            console.log('Updated orders permission: Visible+Read');
        }

        // Also ensure 'production' permission
        const prodPermIndex = rolePerm.permissions.findIndex(p => p.section === 'production');
        if (prodPermIndex === -1) {
            rolePerm.permissions.push({
                section: 'production',
                visibility: true,
                actions: { read: true, create: false, update: true, delete: false }
            });
            console.log('Added production permission');
        } else {
            rolePerm.permissions[prodPermIndex].visibility = true;
            rolePerm.permissions[prodPermIndex].actions.read = true;
            rolePerm.permissions[prodPermIndex].actions.update = true; // Workers need to update jobs
            console.log('Updated production permission');
        }

        await rolePerm.save();
        console.log('Permissions saved successfully.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixPermissions();
