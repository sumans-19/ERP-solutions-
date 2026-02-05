const express = require('express');
const router = express.Router();
const FinishedGood = require('../models/FinishedGood');
const Item = require('../models/Item');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// 1. PUSH TO DOCUMENTATION (From FinishedGood collection)
router.post('/push-to-docs', async (req, res) => {
    try {
        const { fgIds } = req.body;
        if (!fgIds || !fgIds.length) return res.status(400).json({ message: 'No items selected' });

        const results = await FinishedGood.updateMany(
            { _id: { $in: fgIds } },
            { $set: { status: 'In Documentation' } }
        );

        res.json({ message: `Successfully pushed ${results.modifiedCount} items to Documentation Stage`, results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. GET ITEMS IN DOCUMENTATION
router.get('/items', async (req, res) => {
    try {
        const items = await FinishedGood.find({ status: 'In Documentation' }).sort({ updatedAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET MASTER STOCK ITEMS (Items with currentStock > 0 or openingQty > 0)
router.get('/items-with-stock', async (req, res) => {
    try {
        const items = await Item.find({
            $or: [
                { currentStock: { $gt: 0 } },
                { openingQty: { $exists: true, $ne: '' } }
            ]
        })
            .select('name code currentStock unit openingQty')
            .sort({ name: 1 });

        console.log(`[DEBUG] Documentation Master Stock Fetch: Found ${items.length} potential items`);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. PULL FROM MASTER (Fetch from Master Stock to Documentation)
router.post('/pull-from-master', async (req, res) => {
    try {
        const { itemId, qty, remark } = req.body;
        if (!itemId || !qty || qty <= 0) return res.status(400).json({ message: 'Item ID and valid Quantity are required' });

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Master Item not found' });

        if (item.currentStock < qty) {
            return res.status(400).json({ message: `Insufficient stock in Master. Available: ${item.currentStock}` });
        }

        // Create FinishedGood entry
        const newFG = new FinishedGood({
            partNo: item.code,
            partName: item.name,
            qty: qty,
            status: 'In Documentation',
            jobNo: 'MASTER-PULL', // Placeholder since not from a specific job card
            mfgDate: new Date()
        });
        await newFG.save();

        // Decrement Item Master Stock
        item.currentStock -= qty;
        await item.save();

        res.json({ message: `Successfully pulled ${qty} units of ${item.name} to Documentation stage`, newFG });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. DELETE FROM FG (Safe removal after invoicing/packing)
router.post('/delete-from-fg', async (req, res) => {
    try {
        const { fgIds, remark } = req.body;
        if (!fgIds || !fgIds.length) return res.status(400).json({ message: 'No items selected' });
        if (!remark) return res.status(400).json({ message: 'Remark is mandatory for removal' });

        const items = await FinishedGood.find({ _id: { $in: fgIds } });
        const canDelete = items.every(item => item.status !== 'In Stock');

        if (!canDelete) {
            return res.status(400).json({ message: 'Some items are still marked as "In Stock" and cannot be deleted via this flow' });
        }

        await FinishedGood.deleteMany({ _id: { $in: fgIds } });
        res.json({ message: `Successfully removed ${fgIds.length} items from stock permanently.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
