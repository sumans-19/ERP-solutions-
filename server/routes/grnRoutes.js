const express = require('express');
const router = express.Router();
const GRN = require('../models/GRN');
const Counter = require('../models/Counter');

// Helper to get auto-incrementing GRN Number
async function getNextGRNNo() {
    const counter = await Counter.findOneAndUpdate(
        { id: 'grnNo' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    const sequence = counter.seq.toString().padStart(3, '0');
    return `GRN-${year}-${sequence}`;
}

// Get all GRNs
router.get('/', async (req, res) => {
    try {
        const grns = await GRN.find().sort({ createdAt: -1 });
        res.json(grns);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get next GRN number
router.get('/next-number', async (req, res) => {
    try {
        const grnNumber = await getNextGRNNo();
        res.json({ grnNumber });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create GRN
router.post('/', async (req, res) => {
    try {
        let grnNumber = req.body.grnNumber;
        if (!grnNumber) {
            grnNumber = await getNextGRNNo();
        }
        const grn = new GRN({
            ...req.body,
            grnNumber
        });
        const newGRN = await grn.save();
        res.status(201).json(newGRN);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
