const express = require('express');
const router = express.Router();
const RejectedGood = require('../models/RejectedGood');

router.get('/', async (req, res) => {
    try {
        const goods = await RejectedGood.find().sort({ createdAt: -1 });
        res.json(goods);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const newGood = new RejectedGood(req.body);
        const saved = await newGood.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
