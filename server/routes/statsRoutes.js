const express = require('express');
console.log('DEBUG: statsRoutes.js file is being loaded');
const router = express.Router();
const Party = require('../models/Party');
const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Item = require('../models/Item');
const authenticateToken = require('../middleware/auth');

router.get('/planning-stats', authenticateToken, async (req, res) => {
    console.log('📡 ENTERED: GET /api/stats/planning-stats');
    try {
        const [
            partyCount,
            employeeCount,
            orderCount,
            itemCount,
            newCount,
            inProgressCount,
            holdCount
        ] = await Promise.all([
            Party.countDocuments(),
            Employee.countDocuments(),
            Order.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ state: 'New' }),
            Item.countDocuments({ state: { $in: ['Assigned', 'Manufacturing', 'Verification', 'Documentation'] } }),
            Item.countDocuments({ state: 'Hold' })
        ]);

        res.json({
            parties: partyCount,
            employees: employeeCount,
            orders: orderCount,
            items: itemCount,
            newOrders: newCount,
            inProgress: inProgressCount,
            onHold: holdCount
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get daily/monthly trend data
router.get('/dashboard-trend', authenticateToken, async (req, res) => {
    console.log('📡 ENTERED: GET /api/stats/dashboard-trend', req.query);
    try {
        const { timeframe = 'week' } = req.query;
        const trendData = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (timeframe === 'month') {
            // Show last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const end = new Date(today);
                end.setDate(end.getDate() - (i * 7));
                const start = new Date(end);
                start.setDate(start.getDate() - 6);
                start.setHours(0, 0, 0, 0);

                const newCount = await Item.countDocuments({ createdAt: { $gte: start, $lte: end } });
                const progressCount = await Item.countDocuments({
                    stateHistory: {
                        $elemMatch: {
                            state: { $in: ['Assigned', 'Manufacturing', 'Verification', 'Documentation'] },
                            changedAt: { $gte: start, $lte: end }
                        }
                    }
                });

                trendData.push({
                    label: `Week ${4 - i}`,
                    newQueue: newCount,
                    inProgress: progressCount
                });
            }
        } else if (timeframe === 'year') {
            // Show last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
                const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

                const newCount = await Item.countDocuments({ createdAt: { $gte: start, $lte: end } });
                const progressCount = await Item.countDocuments({
                    stateHistory: {
                        $elemMatch: {
                            state: { $in: ['Assigned', 'Manufacturing', 'Verification', 'Documentation'] },
                            changedAt: { $gte: start, $lte: end }
                        }
                    }
                });

                trendData.push({
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    newQueue: newCount,
                    inProgress: progressCount
                });
            }
        } else {
            // Default: Week (7 days)
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);

                const newCount = await Item.countDocuments({
                    createdAt: { $gte: start, $lte: end }
                });

                // For "In Progress", check history transitions
                const progressCount = await Item.countDocuments({
                    stateHistory: {
                        $elemMatch: {
                            state: { $in: ['Assigned', 'Manufacturing', 'Verification', 'Documentation'] },
                            changedAt: { $gte: start, $lte: end }
                        }
                    }
                });

                trendData.push({
                    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    newQueue: newCount,
                    inProgress: progressCount
                });
            }
        }

        res.json(trendData);
    } catch (error) {
        console.error('Trend fetch error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
