const express = require('express');
const router = express.Router();
const PackingSlip = require('../models/PackingSlip');
const Invoice = require('../models/Invoice');
const FinishedGood = require('../models/FinishedGood');
const Counter = require('../models/Counter');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Helper: Generate Packing Slip Number
const generatePackingSlipNo = async () => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { id: 'packingSlipNo' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(5, '0');
    return `PS/${year}/${seq}`;
};

// 1. GENERATE PACKING SLIP (Smart Box Assignment)
router.post('/generate', async (req, res) => {
    try {
        const { invoiceId, boxCapacity } = req.body;
        if (!invoiceId) return res.status(400).json({ message: 'Invoice ID is required' });
        if (!boxCapacity || boxCapacity <= 0) return res.status(400).json({ message: 'Valid Box Capacity is required' });

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const packingSlipNo = await generatePackingSlipNo();
        const boxes = [];
        let currentBox = {
            boxNumber: 1,
            capacity: boxCapacity,
            lots: [],
            totalQty: 0
        };

        // Distribution Logic (Mixed Lots Supported)
        // We iterate through lotDetails of the invoice
        for (const lot of invoice.lotDetails) {
            let remainingLotQty = lot.qty;

            while (remainingLotQty > 0) {
                const spaceInBox = boxCapacity - currentBox.totalQty;
                const qtyToPutInBox = Math.min(remainingLotQty, spaceInBox);

                if (qtyToPutInBox > 0) {
                    currentBox.lots.push({
                        lotNumber: lot.lotNumber,
                        qty: qtyToPutInBox,
                        sourceRef: lot.sourceRef
                    });
                    currentBox.totalQty += qtyToPutInBox;
                    remainingLotQty -= qtyToPutInBox;
                }

                // If box is full, finalize it and start a new one
                if (currentBox.totalQty === boxCapacity && remainingLotQty > 0) {
                    boxes.push({ ...currentBox });
                    currentBox = {
                        boxNumber: boxes.length + 1,
                        capacity: boxCapacity,
                        lots: [],
                        totalQty: 0
                    };
                }
            }
        }

        // Push the last box if it has items
        if (currentBox.totalQty > 0) {
            boxes.push({ ...currentBox });
        }

        // Update box info with totalBoxes
        const finalBoxes = boxes.map(b => ({
            ...b,
            totalBoxes: boxes.length
        }));

        const newPackingSlip = new PackingSlip({
            packingSlipNo,
            invoiceId,
            invoiceNo: invoice.invoiceNo,
            boxes: finalBoxes,
            totalQty: invoice.totalQty,
            totalBoxes: boxes.length,
            status: 'Confirmed'
        });

        const saved = await newPackingSlip.save();

        // Update Invoice status
        invoice.status = 'Packed';
        await invoice.save();

        // Update FG status for all items in this invoice
        await FinishedGood.updateMany(
            { currentStageRef: invoice.invoiceNo },
            { $set: { status: 'Packed' } }
        );

        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. GET ALL PACKING SLIPS
router.get('/', async (req, res) => {
    try {
        const slips = await PackingSlip.find().sort({ createdAt: -1 });
        res.json(slips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
