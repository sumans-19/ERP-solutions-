const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const FinishedGood = require('../models/FinishedGood');
const Counter = require('../models/Counter');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Helper: Generate Invoice Number
const generateInvoiceNo = async () => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { id: 'invoiceNo' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(5, '0');
    return `INV/${year}/${seq}`;
};

// Helper: Generate Lot Number
const generateLotNumber = async () => {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
        { id: 'lotNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(5, '0');
    return `LOT/${year}/${seq}`;
};

// 1. CREATE INVOICE
router.post('/', async (req, res) => {
    try {
        const { customerId, customerName, selectedFGItems, shipmentMode, remarks } = req.body;

        if (!selectedFGItems || !selectedFGItems.length) {
            return res.status(400).json({ message: 'No items selected for invoicing' });
        }

        // Fetch full FG details to group by source and generate lots
        const fgItems = await FinishedGood.find({ _id: { $in: selectedFGItems } });

        const invoiceNo = await generateInvoiceNo();
        const invoiceItems = [];
        const lotDetails = [];

        // Group by Item + Source (JobNo or RejectionId)
        for (const fg of fgItems) {
            const sourceRef = fg.jobNo || fg.rejectionId || 'MANUAL-STOCK';

            // Check if a lot already exists for this source in this invoice
            let lot = lotDetails.find(l => l.sourceRef === sourceRef);
            if (!lot) {
                const lotNum = await generateLotNumber();
                lot = {
                    lotNumber: lotNum,
                    sourceRef: sourceRef,
                    qty: 0
                };
                lotDetails.push(lot);
            }
            lot.qty += fg.qty;

            invoiceItems.push({
                fgId: fg._id,
                partNo: fg.partNo,
                partName: fg.partName,
                qty: fg.qty,
                lotNumber: lot.lotNumber,
                jobNo: fg.jobNo,
                rejectionId: fg.rejectionId
            });

            // Update FG status
            fg.status = 'Invoiced';
            fg.currentStageRef = invoiceNo; // Store invoice number for easy lookup
            await fg.save();
        }

        const newInvoice = new Invoice({
            invoiceNo,
            customerId,
            customerName,
            items: invoiceItems,
            lotDetails,
            shipmentMode,
            totalQty: invoiceItems.reduce((sum, i) => sum + i.qty, 0),
            remarks,
            status: 'Confirmed'
        });

        const saved = await newInvoice.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. GET ALL INVOICES
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 }).populate('customerId', 'name');
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET SINGLE INVOICE
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId', 'name');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
