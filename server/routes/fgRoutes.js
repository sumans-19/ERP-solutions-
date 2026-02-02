const express = require('express');
const router = express.Router();
const FinishedGood = require('../models/FinishedGood');

router.get('/', async (req, res) => {
    try {
        const goods = await FinishedGood.find().sort({ createdAt: -1 });
        res.json(goods);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const newGood = new FinishedGood(req.body);
        const saved = await newGood.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const item = await FinishedGood.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Finished Good not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) return res.status(400).json({ message: 'Remark is mandatory' });
        await FinishedGood.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
