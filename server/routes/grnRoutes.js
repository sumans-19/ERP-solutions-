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

const RawMaterial = require('../models/RawMaterial');

// Create GRN and update Stock
router.post('/', async (req, res) => {
    try {
        let grnNumber = req.body.grnNumber;
        if (!grnNumber) {
            grnNumber = await getNextGRNNo();
        }

        const cleanedItems = (req.body.items || []).map(item => ({
            ...item,
            itemCode: item.itemCode ? item.itemCode.trim() : ''
        }));

        const grn = new GRN({
            ...req.body,
            items: cleanedItems,
            grnNumber
        });

        const newGRN = await grn.save();

        // Update Raw Material Stock
        if (req.body.items && req.body.items.length > 0) {
            const InventoryLog = require('../models/InventoryLog');
            for (const item of req.body.items) {
                if (item.itemCode && item.qty) {
                    const cleanCode = item.itemCode.trim();
                    const quantity = Number(item.qty);

                    if (isNaN(quantity)) continue;

                    const material = await RawMaterial.findOne({ code: cleanCode });
                    if (material) {
                        const oldQty = material.qty;
                        material.qty += quantity;
                        await material.save();

                        // Log stock change
                        await new InventoryLog({
                            itemCode: cleanCode,
                            itemName: material.name,
                            changeType: 'GRN',
                            oldQty: oldQty,
                            newQty: material.qty,
                            changeQty: quantity,
                            remark: `Received via GRN: ${newGRN.grnNumber}`,
                            userName: req.headers['x-user-name'] || 'System',
                            referenceId: newGRN._id,
                            referenceModel: 'GRN'
                        }).save();
                    }
                }
            }
        }

        res.status(201).json(newGRN);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update GRN (with stock adjustment)
router.put('/:id', async (req, res) => {
    try {
        const oldGRN = await GRN.findById(req.params.id);
        if (!oldGRN) return res.status(404).json({ message: 'GRN not found' });

        const InventoryLog = require('../models/InventoryLog');

        // 1. Reverse old stock additions
        for (const item of oldGRN.items) {
            if (item.itemCode && item.qty) {
                const material = await RawMaterial.findOne({ code: item.itemCode.trim() });
                if (material) {
                    const oldQty = material.qty;
                    material.qty -= item.qty;
                    if (material.qty < 0) material.qty = 0;
                    await material.save();

                    await new InventoryLog({
                        itemCode: material.code,
                        itemName: material.name,
                        changeType: 'GRN Edit (Reverse)',
                        oldQty: oldQty,
                        newQty: material.qty,
                        changeQty: -item.qty,
                        remark: `Stock reversed for GRN Edit: ${oldGRN.grnNumber}`,
                        userName: req.headers['x-user-name'] || 'System',
                        referenceId: oldGRN._id,
                        referenceModel: 'GRN'
                    }).save();
                }
            }
        }

        // 2. Update GRN data
        const { _id: bodyId, createdAt, updatedAt, __v, ...updateData } = req.body;
        const cleanedItems = (updateData.items || []).map(item => ({
            ...item,
            itemCode: item.itemCode ? item.itemCode.trim() : ''
        }));

        const updatedGRN = await GRN.findByIdAndUpdate(req.params.id, {
            ...updateData,
            items: cleanedItems
        }, { new: true });

        // 3. Apply new stock additions
        for (const item of updatedGRN.items) {
            if (item.itemCode && item.qty) {
                const material = await RawMaterial.findOne({ code: item.itemCode.trim() });
                if (material) {
                    const oldQty = material.qty;
                    material.qty += item.qty;
                    await material.save();

                    await new InventoryLog({
                        itemCode: material.code,
                        itemName: material.name,
                        changeType: 'GRN Edit (Apply)',
                        oldQty: oldQty,
                        newQty: material.qty,
                        changeQty: item.qty,
                        remark: `New stock applied for GRN Edit: ${updatedGRN.grnNumber}`,
                        userName: req.headers['x-user-name'] || 'System',
                        referenceId: updatedGRN._id,
                        referenceModel: 'GRN'
                    }).save();
                }
            }
        }

        res.json(updatedGRN);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete GRN (with mandatory remark and stock reduction)
router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) {
            return res.status(400).json({ message: 'Remark is mandatory for deletion.' });
        }

        const grn = await GRN.findById(req.params.id);
        if (!grn) return res.status(404).json({ message: 'GRN not found' });

        // Reduce Raw Material Stock
        const InventoryLog = require('../models/InventoryLog');
        for (const item of grn.items) {
            if (item.itemCode && item.qty) {
                const material = await RawMaterial.findOne({ code: item.itemCode.trim() });
                if (material) {
                    const oldQty = material.qty;
                    material.qty -= item.qty;
                    // Note: Backend Rules say RM stock never becomes negative, 
                    // but if a GRN is deleted we might have to allow it or check if stock is enough.
                    // Requirement 3.2 says RM stock is reduced accordingly. 
                    // Let's enforce the "never negative" rule here too.
                    if (material.qty < 0) material.qty = 0;
                    await material.save();

                    // Log stock change
                    await new InventoryLog({
                        itemCode: material.code,
                        itemName: material.name,
                        changeType: 'Delete',
                        oldQty: oldQty,
                        newQty: material.qty,
                        changeQty: -item.qty,
                        remark: `Deleted GRN: ${grn.grnNumber}. Reason: ${remark}`,
                        userName: req.headers['x-user-name'] || 'System',
                        referenceId: grn._id,
                        referenceModel: 'GRN'
                    }).save();
                }
            }
        }

        await GRN.findByIdAndDelete(req.params.id);
        res.json({ message: 'GRN deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
