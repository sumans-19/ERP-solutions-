const express = require('express');
const router = express.Router();
const Party = require('../models/Party');
const PartyFollowUp = require('../models/PartyFollowUp');

// GET /api/parties - Fetch all parties
router.get('/', async (req, res) => {
    try {
        const parties = await Party.find().sort({ name: 1 });
        res.json(parties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/parties - Create new party (Testing/Seeding)
router.post('/', async (req, res) => {
    try {
        const newParty = new Party(req.body);
        const savedParty = await newParty.save();
        res.status(201).json(savedParty);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /api/parties/follow-ups - Fetch follow ups for a party
router.get('/follow-ups', async (req, res) => {
    const { partyId } = req.query;
    if (!partyId) return res.status(400).json({ message: 'partyId is required' });

    try {
        const followUps = await PartyFollowUp.find({ partyId }).sort({ meetingDateTime: -1 });
        res.json(followUps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/parties/follow-ups - Create new follow up
router.post('/follow-ups', async (req, res) => {
    const { partyId, partyName, meetingDateTime, remarks, flag, createdByName, createdByRole } = req.body;

    if (!partyId || !meetingDateTime || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const newFollowUp = new PartyFollowUp({
            partyId,
            partyName,
            meetingDateTime,
            remarks,
            flag: flag || 'neutral',
            createdByName: createdByName || 'System',
            createdByRole: createdByRole || 'Admin'
        });

        const savedFollowUp = await newFollowUp.save();
        res.status(201).json(savedFollowUp);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
