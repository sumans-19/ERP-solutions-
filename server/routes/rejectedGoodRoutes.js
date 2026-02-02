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

router.put('/:id', async (req, res) => {
    try {
        const item = await RejectedGood.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Rejected Good not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) return res.status(400).json({ message: 'Remark is mandatory' });
        await RejectedGood.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
