const express = require('express');
const router = express.Router();
const Order = require('../models/Order');


// Re-writing GET to use Aggregation specifically
router.get('/', async (req, res) => {
    try {
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: 'orderId',
                    as: 'items'
                }
            },
            {
                // We need to resolve employeeId in processAssignments. 
                // Unwind -> Lookup -> Group is one way, but let's send IDs and let Frontend map if we have full employee list.
                // Box 1 loads ALL employees. So we just need employeeId in assignments.
                // The frontend can lookup the name from the Employee Context/State.
                $project: {
                    orderId: 1,
                    description: 1,
                    status: 1,
                    createdAt: 1,
                    processAssignments: 1,
                    items: 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/orders/:id/process-assign
router.patch('/:id/process-assign', async (req, res) => {
    const { process, employeeId } = req.body;

    if (!process || !employeeId) {
        return res.status(400).json({ message: 'Process and EmployeeId are required' });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Remove existing assignment for this specific process step if exists
        order.processAssignments = order.processAssignments.filter(p => p.processName !== process);

        // Add new assignment
        order.processAssignments.push({
            processName: process,
            employeeId: employeeId,
            assignedAt: new Date()
        });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
