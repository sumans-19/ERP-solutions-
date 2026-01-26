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

// GET /api/parties/follow-ups - Fetch follow ups for a party
router.get('/follow-ups', async (req, res) => {
    const { partyId } = req.query;
    if (!partyId) return res.status(400).json({ message: 'partyId is required' });

    try {
        console.log(`Fetching follow ups for partyId: ${partyId}`);
        const followUps = await PartyFollowUp.find({ partyId }).sort({ meetingDateTime: -1 });
        console.log(`Found ${followUps.length} follow ups`);
        res.json(followUps);
    } catch (err) {
        console.error('Error fetching follow ups:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/parties/follow-ups - Create new follow up
router.post('/follow-ups', async (req, res) => {
    const { partyId, partyName, meetingDateTime, remarks, flag, createdByName, createdByRole } = req.body;

    console.log('Creating follow up:', req.body);

    if (!partyId || !meetingDateTime || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const newFollowUp = new PartyFollowUp({
            partyId,
            partyName,
            meetingDateTime: new Date(meetingDateTime),
            remarks,
            flag: flag || 'neutral',
            createdByName: createdByName || 'System',
            createdByRole: createdByRole || 'Admin'
        });

        const savedFollowUp = await newFollowUp.save();
        console.log('Follow up saved successfully');
        res.status(201).json(savedFollowUp);
    } catch (err) {
        console.error('Error saving follow up:', err);
        res.status(400).json({ message: err.message });
    }
});

// GET /api/parties/:id - Get party by ID
router.get('/:id', async (req, res) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }
        res.json(party);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/parties - Create new party
router.post('/', async (req, res) => {
    try {
        const newParty = new Party(req.body);
        const savedParty = await newParty.save();
        res.status(201).json(savedParty);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/parties/:id - Update party
router.put('/:id', async (req, res) => {
    try {
        const updatedParty = await Party.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedParty) {
            return res.status(404).json({ message: 'Party not found' });
        }
        res.json(updatedParty);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/parties/:id - Delete party
router.delete('/:id', async (req, res) => {
    try {
        const deletedParty = await Party.findByIdAndDelete(req.params.id);
        if (!deletedParty) {
            return res.status(404).json({ message: 'Party not found' });
        }
        res.json({ message: 'Party deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
