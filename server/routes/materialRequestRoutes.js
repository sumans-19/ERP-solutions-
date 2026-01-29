const express = require('express');
const router = express.Router();
const MaterialRequest = require('../models/MaterialRequest');
const Counter = require('../models/Counter');

// Helper to get auto-incrementing MR No
async function getNextMRNo() {
    const counter = await Counter.findOneAndUpdate(
        { id: 'mrNo' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    const sequence = counter.seq.toString().padStart(3, '0');
    return `MR-${year}-${sequence}`;
}

// Get all material requests
router.get('/', async (req, res) => {
    try {
        const requests = await MaterialRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get next MR number (pre-increment for reservation)
router.get('/next-number', async (req, res) => {
    try {
        const mrNo = await getNextMRNo();
        res.json({ mrNo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create material request
router.post('/', async (req, res) => {
    try {
        let mrNo = req.body.mrNo;
        if (!mrNo) {
            mrNo = await getNextMRNo();
        }
        const request = new MaterialRequest({
            ...req.body,
            mrNo
        });
        const newRequest = await request.save();
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
