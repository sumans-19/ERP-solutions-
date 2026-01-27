const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const authenticateToken = require('../middleware/auth');

// GET /api/system-settings - Fetch global settings (Singleton)
router.get('/', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/system-settings - Update global settings
router.put('/', authenticateToken, async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings(req.body);
        } else {
            Object.assign(settings, req.body);
            settings.updatedAt = Date.now();
        }
        const savedSettings = await settings.save();
        console.log('⚙️ System Settings Updated');
        res.json(savedSettings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
