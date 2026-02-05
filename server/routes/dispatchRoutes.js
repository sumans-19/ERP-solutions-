const express = require('express');
const router = express.Router();
const PackingSlip = require('../models/PackingSlip');
const Invoice = require('../models/Invoice');
const FinishedGood = require('../models/FinishedGood');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// 1. GET ALL PACKED SLIPS (Ready for Dispatch)
router.get('/ready', async (req, res) => {
    try {
        const slips = await PackingSlip.find({ status: 'Confirmed' }).sort({ updatedAt: -1 });
        res.json(slips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. DISPATCH CONSIGNMENT
router.post('/confirm', async (req, res) => {
    try {
        const { packingSlipId, vehicleNo, driverName, contactNo, remarks } = req.body;

        if (!packingSlipId) return res.status(400).json({ message: 'Packing Slip ID is required' });

        const slip = await PackingSlip.findById(packingSlipId);
        if (!slip) return res.status(404).json({ message: 'Packing Slip not found' });

        // Update Slip
        slip.status = 'Dispatched';
        slip.dispatchDetails = {
            vehicleNo,
            driverName,
            contactNo,
            remarks,
            dispatchedAt: new Date()
        };
        await slip.save();

        // Update Invoice
        await Invoice.findByIdAndUpdate(slip.invoiceId, { $set: { status: 'Dispatched' } });

        // Update FG Stock Status
        await FinishedGood.updateMany(
            { currentStageRef: slip.invoiceNo },
            { $set: { status: 'Dispatched' } }
        );

        res.json({ message: 'Consignment successfully marked as Dispatched', slip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET DISPATCH HISTORY
router.get('/history', async (req, res) => {
    try {
        const history = await PackingSlip.find({ status: 'Dispatched' })
            .populate({
                path: 'invoiceId',
                select: 'customerName customerId totalQty shipmentMode remarks'
            })
            .sort({ updatedAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
