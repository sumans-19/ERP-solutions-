const express = require('express');
const router = express.Router();
const WIPStock = require('../models/WIPStock');

router.get('/', async (req, res) => {
    try {
        const stock = await WIPStock.find().sort({ createdAt: -1 });
        res.json(stock);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const newStock = new WIPStock(req.body);
        const saved = await newStock.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
