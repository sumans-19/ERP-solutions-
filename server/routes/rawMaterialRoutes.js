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

// Create raw material template (automatically creates stock with qty 0)
router.post('/', async (req, res) => {
    try {
        const materialData = {
            ...req.body,
            qty: 0 // Initial stock must always be 0
        };
        const material = new RawMaterial(materialData);
        const newMaterial = await material.save();

        // Log creation
        const InventoryLog = require('../models/InventoryLog');
        await new InventoryLog({
            itemCode: newMaterial.code,
            itemName: newMaterial.name,
            changeType: 'Add',
            oldQty: 0,
            newQty: 0,
            changeQty: 0,
            remark: 'Initial template creation',
            userName: req.headers['x-user-name'] || 'System',
            referenceId: newMaterial._id,
            referenceModel: 'RawMaterial'
        }).save();

        res.status(201).json(newMaterial);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Item Code already exists. Please use a unique code.' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Update raw material
router.put('/:id', async (req, res) => {
    try {
        const updatedMaterial = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMaterial);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Item Code already exists on another material.' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Get GRN History for a material
router.get('/:code/grn-history', async (req, res) => {
    try {
        const GRN = require('../models/GRN');
        const searchCode = req.params.code.trim();
        // Use case-insensitive regex match that also handles optional whitespace
        const grns = await GRN.find({
            'items.itemCode': { $regex: new RegExp(`^\\s*${searchCode}\\s*$`, 'i') }
        }).sort({ createdAt: -1 });
        res.json(grns);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const GRN = require('../models/GRN');

// Recalculate stock for all materials based on GRNs
// Recalculate stock for all materials based on GRNs - Consumptions
router.post('/recalculate', async (req, res) => {
    try {
        const JobCard = require('../models/JobCard');
        const WIPStock = require('../models/WIPStock');

        const materials = await RawMaterial.find({});
        const results = [];

        console.log('[Sync] Starting full stock recalculation...');

        // 1. Calculate Deductions from Jobs
        const allJobs = await JobCard.find({});
        const consumptionMap = {}; // code -> totalConsumed

        allJobs.forEach(job => {
            if (job.rmRequirements && Array.isArray(job.rmRequirements)) {
                job.rmRequirements.forEach(req => {
                    const code = (req.itemCode || req.code || '').trim();
                    if (code) {
                        consumptionMap[code] = (consumptionMap[code] || 0) + (parseFloat(req.required) || 0);
                    }
                });
            }
        });

        // 2. Calculate Inflow from GRNs and Update RM Stock
        for (const rm of materials) {
            if (!rm.code) continue;
            const targetCode = rm.code.trim();

            // Inflow
            const grns = await GRN.find({ 'items.itemCode': { $regex: new RegExp(`^${targetCode}$`, 'i') } });
            let totalInflow = 0;
            grns.forEach(grn => {
                grn.items.forEach(item => {
                    if (item.itemCode && item.itemCode.trim().toLowerCase() === targetCode.toLowerCase()) {
                        totalInflow += (parseFloat(item.qty) || 0);
                    }
                });
            });

            // Outflow
            const totalOutflow = consumptionMap[targetCode] || 0;

            // Net Stock
            const netQty = totalInflow - totalOutflow;
            rm.qty = netQty > 0 ? netQty : 0; // Prevent negative if data inconsistency

            await rm.save();
            results.push({ code: targetCode, inflow: totalInflow, outflow: totalOutflow, net: rm.qty });
        }

        // 3. Backfill WIP Data (Fixing "Same Same" issue)
        const wipItems = await WIPStock.find({});
        let wipUpdates = 0;
        for (const wip of wipItems) {
            if (!wip.initialQty || !wip.rmConsumed) {
                const job = allJobs.find(j => j.jobNumber === wip.jobNo);
                if (job) {
                    wip.initialQty = job.quantity;
                    wip.batchCode = job.jobNumber;

                    const rmLog = [];
                    if (job.rmRequirements) {
                        job.rmRequirements.forEach(r => {
                            if (r.required > 0) rmLog.push(`${r.required} ${r.uom || ''} (${r.itemCode || r.code})`);
                        });
                    }
                    wip.rmConsumed = rmLog.join(', ') || 'None';

                    await wip.save();
                    wipUpdates++;
                }
            }
        }

        console.log(`[Sync] Completed. Updated ${results.length} materials and fixed ${wipUpdates} WIP entries.`);
        res.json({ message: 'Stock synchronized and WIP data backfilled', results, wipUpdates });
    } catch (err) {
        console.error('[Sync] Error:', err);
        res.status(500).json({ message: err.message });
    }
});


// Delete raw material (with mandatory remark)
router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) {
            return res.status(400).json({ message: 'Remark is mandatory for deletion.' });
        }

        const material = await RawMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        // Log deletion
        const InventoryLog = require('../models/InventoryLog');
        await new InventoryLog({
            itemCode: material.code,
            itemName: material.name,
            changeType: 'Delete',
            oldQty: material.qty,
            newQty: 0,
            changeQty: -material.qty,
            remark: remark,
            userName: req.headers['x-user-name'] || 'System',
            referenceId: material._id,
            referenceModel: 'RawMaterial'
        }).save();

        await RawMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Stock (with reason and remark)
router.patch('/:id/stock', async (req, res) => {
    try {
        const { changeQty, reason, remark } = req.body;
        const material = await RawMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        const oldQty = material.qty;
        const transformQty = parseFloat(changeQty);
        const newQty = oldQty + transformQty;

        if (newQty < 0) {
            return res.status(400).json({ message: 'RM stock never becomes negative.' });
        }

        material.qty = newQty;
        await material.save();

        // Log stock adjustment
        const InventoryLog = require('../models/InventoryLog');
        await new InventoryLog({
            itemCode: material.code,
            itemName: material.name,
            changeType: 'Stock Adjustment',
            oldQty: oldQty,
            newQty: newQty,
            changeQty: transformQty,
            reason: reason,
            remark: remark,
            userName: req.headers['x-user-name'] || 'System',
            referenceId: material._id,
            referenceModel: 'RawMaterial'
        }).save();

        res.json(material);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
