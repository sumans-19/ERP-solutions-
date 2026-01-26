const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET /api/inventory - Fetch all raw materials
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/inventory - Create new raw material
router.post('/', async (req, res) => {
    try {
        const { name, qty, unit, expiry } = req.body;

        if (!name || !qty || !unit || !expiry) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newItem = new Inventory({
            name,
            qty,
            unit,
            expiry
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/inventory/seed - Seed exactly 5 raw materials
router.post('/seed', async (req, res) => {
    try {
        // Clear existing to ensure clean state
        await Inventory.deleteMany({});

        const today = new Date();

        // Helper to add months
        const addMonths = (date, months) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + months);
            return d;
        };

        const seedData = [
            {
                name: 'Carbon Sheet',
                qty: 250,
                unit: 'meters',
                expiry: addMonths(today, 6)
            },
            {
                name: 'Vinyl Roll',
                qty: 120,
                unit: 'meters',
                expiry: addMonths(today, 3)
            },
            {
                name: 'Black Paint',
                qty: 40,
                unit: 'cans',
                expiry: addMonths(today, 12)
            },
            {
                name: 'Aluminium Rod',
                qty: 75,
                unit: 'kg',
                expiry: addMonths(today, 9)
            },
            {
                name: 'Acrylic Sheet',
                qty: 60,
                unit: 'sheets',
                expiry: addMonths(today, 4)
            }
        ];

        const filled = await Inventory.insertMany(seedData);
        res.json({ success: true, count: filled.length, items: filled });
    } catch (error) {
        console.error('Error seeding inventory:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
