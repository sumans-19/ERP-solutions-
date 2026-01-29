const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');

// Get all raw materials
router.get('/', async (req, res) => {
    try {
        const materials = await RawMaterial.find().sort({ createdAt: -1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create raw material
router.post('/', async (req, res) => {
    const material = new RawMaterial(req.body);
    try {
        const newMaterial = await material.save();
        res.status(201).json(newMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update raw material
router.put('/:id', async (req, res) => {
    try {
        const updatedMaterial = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete raw material
router.delete('/:id', async (req, res) => {
    try {
        await RawMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
