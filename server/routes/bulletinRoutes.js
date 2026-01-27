const express = require('express');
const router = express.Router();
const Bulletin = require('../models/Bulletin');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Get all bulletins
router.get('/', authenticateToken, async (req, res) => {
    try {
        const bulletins = await Bulletin.find()
            .populate('createdBy', 'email role')
            .sort({ date: -1 });
        res.json(bulletins);
    } catch (error) {
        console.error('Error fetching bulletins:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a bulletin (Admin only)
router.post('/', authenticateToken, checkPermission('manageUsers'), async (req, res) => {
    try {
        const { title, content, priority } = req.body;

        const bulletin = new Bulletin({
            title,
            content,
            priority,
            createdBy: req.user.id
        });

        await bulletin.save();
        res.status(201).json(bulletin);
    } catch (error) {
        console.error('Error creating bulletin:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a bulletin (Admin only)
router.delete('/:id', authenticateToken, checkPermission('manageUsers'), async (req, res) => {
    try {
        const bulletin = await Bulletin.findByIdAndDelete(req.params.id);

        if (!bulletin) {
            return res.status(404).json({ message: 'Bulletin not found' });
        }

        res.json({ message: 'Bulletin deleted successfully' });
    } catch (error) {
        console.error('Error deleting bulletin:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
