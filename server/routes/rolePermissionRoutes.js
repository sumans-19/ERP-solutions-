const express = require('express');
const router = express.Router();
const RolePermission = require('../models/RolePermission');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Only Developer/Admin should manage permissions
router.get('/', authenticateToken, async (req, res) => {
    try {
        const permissions = await RolePermission.find();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:role', authenticateToken, async (req, res) => {
    try {
        const permission = await RolePermission.findOne({ role: req.params.role });
        if (!permission) return res.status(404).json({ message: 'Role not found' });
        res.json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:role', authenticateToken, async (req, res) => {
    try {
        // Double check it's the supreme developer
        if (req.user.role !== 'development') {
            return res.status(403).json({ message: 'Only Supreme Developer can modify universal preferences.' });
        }

        const { permissions } = req.body;
        const updated = await RolePermission.findOneAndUpdate(
            { role: req.params.role },
            { permissions, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
