const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Get recent activities
router.get('/', async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
