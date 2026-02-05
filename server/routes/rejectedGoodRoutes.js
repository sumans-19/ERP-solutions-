const express = require('express');
const router = express.Router();
const RejectedGood = require('../models/RejectedGood');
const Counter = require('../models/Counter');
const FinishedGood = require('../models/FinishedGood');
const Item = require('../models/Item');
const authenticateToken = require('../middleware/auth');

console.log('✅ ROUTER: Rejected Goods Routes loaded');

router.use(authenticateToken);

// Helper to generate Rejection ID
const generateRejectionId = async (prefix = 'REJ-CUST') => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { id: 'rejectionId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(5, '0');
    return `${prefix}-${year}-${seq}`;
};

// GET all
router.get('/', async (req, res) => {
    try {
        const goods = await RejectedGood.find()
            .sort({ createdAt: -1 })
            .populate('itemId', 'name code unit')
            .populate('jobId', 'jobNumber');
        res.json(goods);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE manual entry
router.post('/', async (req, res) => {
    try {
        const rejectionId = await generateRejectionId(req.body.invoiceNo);
        const newGood = new RejectedGood({
            ...req.body,
            rejectionId,
            source: 'Manual'
        });
        const saved = await newGood.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// HANDLE BATCH ACTIONS (Action on all items with same rejectionId)
router.post('/batch-action', async (req, res) => {
    try {
        const { action, payload, rejectionId } = req.body;
        const userId = req.user?._id || req.user?.id;

        if (!rejectionId) return res.status(400).json({ message: 'Rejection ID is required' });

        const items = await RejectedGood.find({ rejectionId, status: { $ne: 'Recovered' } });
        if (!items.length) return res.status(404).json({ message: 'No active rejected items found for this ID' });

        const firstItem = items[0];

        if (action === 'push_to_fg') {
            const totalAvailable = items.reduce((sum, item) => sum + item.qty, 0);
            const recoveredQty = Number(payload.recoveredQty);

            if (recoveredQty > totalAvailable) {
                return res.status(400).json({ message: 'Cannot recover more than total rejected quantity' });
            }

            // Create ONE FG Entry for the batch
            const newFG = new FinishedGood({
                partNo: firstItem.partNo,
                partName: firstItem.partName,
                qty: recoveredQty,
                mfgDate: firstItem.mfgDate,
                jobNo: firstItem.jobNo,
                poNo: firstItem.poNo,
                sourceJobNo: firstItem.jobNo,
                rejectionId: firstItem.rejectionId,
                recoveryRef: payload.targetBatchNumber || `REC-${firstItem.rejectionId}`,
                isRecovered: true
            });
            await newFG.save();

            // Sequentially reduce quantity from items in batch
            let remainingToRecover = recoveredQty;
            for (const item of items) {
                if (remainingToRecover <= 0) break;

                const take = Math.min(item.qty, remainingToRecover);
                item.qty -= take;
                remainingToRecover -= take;

                if (item.qty === 0) item.status = 'Recovered';

                item.recoveryDetails = {
                    recoveredQty: take,
                    targetBatchNumber: payload.targetBatchNumber,
                    remarks: payload.remarks,
                    date: new Date(),
                    recoveredBy: userId
                };
                await item.save();
            }

            return res.json({ message: `Successfully recovered ${recoveredQty} units to Finished Goods`, newFG });
        }

        if (action === 'scrap') {
            if (!payload.remarks) return res.status(400).json({ message: 'Remark is mandatory for scrapping' });

            await RejectedGood.updateMany(
                { rejectionId, status: { $ne: 'Recovered' } },
                {
                    $set: {
                        status: 'Scrapped',
                        qty: 0,
                        scrapDetails: {
                            scrappedQty: 0, // In batch, we mark all as scrapped
                            remarks: payload.remarks,
                            date: new Date(),
                            scrappedBy: userId
                        }
                    }
                }
            );
            return res.json({ message: 'Entire batch moved to Scrap' });
        }

        if (action === 'hold' || action === 'release') {
            const newStatus = action === 'hold' ? 'Hold' : 'Pending';
            const updateData = { status: newStatus };
            if (action === 'hold') {
                updateData.holdDetails = {
                    remarks: payload.remarks,
                    date: new Date(),
                    heldBy: userId
                };
            }

            await RejectedGood.updateMany(
                { rejectionId, status: { $ne: 'Recovered' } },
                { $set: updateData }
            );
            return res.json({ message: `Batch ${action === 'hold' ? 'placed on Hold' : 'released from Hold'}` });
        }

        res.status(400).json({ message: 'Invalid batch action' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// HANDLE INDIVIDUAL ACTIONS (Fallback/Existing)
router.post('/:id/action', async (req, res) => {
    try {
        const { action, payload } = req.body;
        const { id } = req.params;
        const userId = req.user?._id || req.user?.id;

        const rejectedItem = await RejectedGood.findById(id);
        if (!rejectedItem) return res.status(404).json({ message: 'Rejected Good not found' });

        if (action === 'push_to_fg') {
            const recoveredQty = Number(payload.recoveredQty);
            if (recoveredQty > rejectedItem.qty) {
                return res.status(400).json({ message: 'Cannot recover more than rejected quantity' });
            }

            // Create FG Entry
            const newFG = new FinishedGood({
                partNo: rejectedItem.partNo,
                partName: rejectedItem.partName,
                qty: recoveredQty,
                mfgDate: rejectedItem.mfgDate,
                jobNo: rejectedItem.jobNo,
                poNo: rejectedItem.poNo,

                // Recovery Tracking
                sourceJobNo: rejectedItem.jobNo,
                rejectionId: rejectedItem.rejectionId,
                recoveryRef: payload.targetBatchNumber || `REC-${rejectedItem.rejectionId}`,
                isRecovered: true
            });
            await newFG.save();

            // Lifecycle management
            if (recoveredQty === rejectedItem.qty) {
                rejectedItem.status = 'Recovered';
                rejectedItem.qty = 0;
            } else {
                rejectedItem.qty -= recoveredQty;
            }

            rejectedItem.recoveryDetails = {
                recoveredQty,
                targetBatchNumber: payload.targetBatchNumber,
                remarks: payload.remarks,
                date: new Date(),
                recoveredBy: userId
            };
            await rejectedItem.save();
            return res.json({ message: 'Successfully moved to Finished Goods', newFG });
        }

        if (action === 'scrap') {
            if (!payload.remarks) return res.status(400).json({ message: 'Remark is mandatory for scrapping' });

            rejectedItem.status = 'Scrapped';
            rejectedItem.scrapDetails = {
                scrappedQty: rejectedItem.qty,
                remarks: payload.remarks,
                date: new Date(),
                scrappedBy: userId
            };
            rejectedItem.qty = 0;
            await rejectedItem.save();
            return res.json({ message: 'Successfully moved to Scrap' });
        }

        if (action === 'hold') {
            rejectedItem.status = 'Hold';
            rejectedItem.holdDetails = {
                remarks: payload.remarks,
                date: new Date(),
                heldBy: userId
            };
            await rejectedItem.save();
            return res.json({ message: 'Item placed on Hold' });
        }

        if (action === 'release') {
            rejectedItem.status = 'Pending';
            await rejectedItem.save();
            return res.json({ message: 'Item released from Hold' });
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const updated = await RejectedGood.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const { remark } = req.body;
        if (!remark) return res.status(400).json({ message: 'Remark is mandatory for deletion' });

        // Log deletion could go here if an audit collection existed
        await RejectedGood.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
