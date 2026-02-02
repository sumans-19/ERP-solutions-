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

// Update Material Request Status (Approved/Rejected/On Hold)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, remark, updatedBy } = req.body;
        const mr = await MaterialRequest.findById(req.params.id);
        if (!mr) return res.status(404).json({ message: 'Material Request not found' });

        mr.status = status;
        mr.statusHistory.push({
            status,
            updatedBy: updatedBy || 'System',
            remark
        });

        await mr.save();
        res.json(mr);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Material Request (General)
router.put('/:id', async (req, res) => {
    try {
        const mr = await MaterialRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!mr) return res.status(404).json({ message: 'Material Request not found' });
        res.json(mr);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Material Request (with mandatory remark)
router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) {
            return res.status(400).json({ message: 'Remark is mandatory for deletion.' });
        }

        await MaterialRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material Request deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
