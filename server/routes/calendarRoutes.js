const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const JobCard = require('../models/JobCard');
const Task = require('../models/Task');
const PartyFollowUp = require('../models/PartyFollowUp');
const Todo = require('../models/Todo');
const Inventory = require('../models/Inventory');
const GRN = require('../models/GRN');
const RawMaterial = require('../models/RawMaterial');
const MaterialRequest = require('../models/MaterialRequest');
const FinishedGood = require('../models/FinishedGood');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

// Get aggregated calendar events
router.get('/events', async (req, res) => {
    try {
        const { start, end } = req.query;
        let dateFilter = {};

        if (start && end) {
            dateFilter = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }

        // 1. Fetch Orders (Delivery Date)
        const orderQuery = start && end ? { estimatedDeliveryDate: dateFilter } : {};
        const orders = await Order.find(orderQuery)
            .select('partyName poNumber estimatedDeliveryDate status items totalAmount')
            .lean();

        // 2. Fetch Job Cards (Target Deadline)
        const jobQuery = start && end ? { 'steps.targetDeadline': dateFilter } : {};
        // Note: This matches if ANY step has a deadline in range, but for calendar we usually want the Job's main delivery date or specific step deadlines.
        // For simplicity, let's use the Job's main delivery date if available, or track individual steps.
        // Let's stick to Job Delivery Date for the main view.
        const jobQueryMain = start && end ? { deliveryDate: dateFilter } : {};
        const jobs = await JobCard.find(jobQueryMain)
            .populate('itemId', 'name code')
            .populate('orderId', 'partyName')
            .select('jobNumber itemId quantity status deliveryDate priority')
            .lean();

        // 3. Fetch Tasks (Due Date)
        const taskQuery = start && end ? { dueDate: dateFilter } : {};
        const tasks = await Task.find(taskQuery)
            .select('title priority status dueDate employeeId')
            .lean();

        // 4. Fetch Party Follow-ups (Meeting Date)
        const followUpQuery = start && end ? { meetingDateTime: dateFilter } : {};
        const followUps = await PartyFollowUp.find(followUpQuery)
            .select('partyName meetingDateTime remarks flag')
            .lean();

        // 5. Fetch Todos (Deadline or Start Date)
        const todoQuery = start && end ? {
            $or: [
                { deadlineDate: dateFilter },
                { date: dateFilter }
            ]
        } : {};
        const todos = await Todo.find(todoQuery)
            .select('taskName deadlineDate date status assignmentName')
            .lean();

        // 6. Fetch Inventory Expiry
        const inventoryQuery = start && end ? { expiry: dateFilter } : {};
        const inventoryItems = await Inventory.find(inventoryQuery)
            .select('name code qty unit expiry')
            .lean();

        // 7. Fetch GRN Expiry
        const grnQuery = start && end ? { 'items.expDate': dateFilter } : {};
        const grns = await GRN.find(grnQuery)
            .select('grnNumber supplierName items receiveDate')
            .lean();

        // 8. Fetch Raw Material Expiry
        const rmQuery = start && end ? { expDate: dateFilter } : {};
        const rawMaterials = await RawMaterial.find(rmQuery)
            .select('name code qty uom expDate')
            .lean();

        // 9. Fetch Material Request Items Expiry
        const mrQuery = start && end ? { 'items.expDate': dateFilter } : {};
        const mrs = await MaterialRequest.find(mrQuery)
            .select('mrNo items requestDate')
            .lean();

        // 10. Fetch Finished Goods Expiry
        const fgQuery = start && end ? { expDate: dateFilter } : {};
        const fgs = await FinishedGood.find(fgQuery)
            .select('partName partNo qty expDate')
            .lean();

        // 11. Fetch Job Card Step Deadlines
        const jobStepQuery = start && end ? { 'steps.targetDeadline': dateFilter } : {};
        const jobSteps = await JobCard.find(jobStepQuery)
            .populate('itemId', 'name')
            .select('jobNumber steps itemId')
            .lean();

        console.log(`📅 Calendar Data Found: 
            Orders: ${orders.length}, 
            Jobs: ${jobs.length}, 
            Tasks: ${tasks.length}, 
            FollowUps: ${followUps.length}, 
            Todos: ${todos.length},
            Inventory: ${inventoryItems.length},
            FG: ${fgs.length}`);

        const events = [];

        // Map Orders
        orders.forEach(o => {
            if (o.estimatedDeliveryDate) {
                events.push({
                    id: o._id,
                    type: 'order',
                    title: `Delivery: ${o.partyName}`,
                    date: o.estimatedDeliveryDate,
                    status: o.status,
                    priority: 'High', // Orders are generally high priority
                    details: {
                        subtitle: `PO: ${o.poNumber}`,
                        amount: o.totalAmount,
                        itemCount: o.items?.length || 0
                    }
                });
            }
        });

        // Map Jobs
        jobs.forEach(j => {
            if (j.deliveryDate) {
                events.push({
                    id: j._id,
                    type: 'job',
                    title: `Job: ${j.itemId?.name || 'Unknown Item'}`,
                    date: j.deliveryDate,
                    status: j.status,
                    priority: j.priority,
                    details: {
                        subtitle: j.jobNumber,
                        quantity: j.quantity,
                        party: j.orderId?.partyName
                    }
                });
            }
        });

        // Map Tasks
        tasks.forEach(t => {
            if (t.dueDate) {
                events.push({
                    id: t._id,
                    type: 'task',
                    title: `Task: ${t.title}`,
                    date: t.dueDate,
                    status: t.status,
                    priority: t.priority,
                    details: {
                        subtitle: `Assigned to: ${t.employeeId}`,
                    }
                });
            }
        });

        // Map Follow-ups
        followUps.forEach(f => {
            if (f.meetingDateTime) {
                events.push({
                    id: f._id,
                    type: 'followup',
                    title: `Meeting: ${f.partyName}`,
                    date: f.meetingDateTime,
                    status: f.flag === 'positive' ? 'Positive' : f.flag === 'negative' ? 'Negative' : 'Pending',
                    priority: 'Medium',
                    details: {
                        subtitle: f.remarks,
                        flag: f.flag
                    }
                });
            }
        });

        // Map Todos
        todos.forEach(t => {
            const displayDate = t.deadlineDate || t.date;
            if (displayDate) {
                events.push({
                    id: t._id,
                    type: 'todo',
                    title: `${t.deadlineDate ? 'Deadline' : 'Todo'}: ${t.taskName}`,
                    date: displayDate,
                    status: t.status,
                    priority: 'Medium',
                    details: {
                        subtitle: `Assigned to: ${t.assignmentName || 'Unassigned'}`,
                        scheduled: t.date ? new Date(t.date).toLocaleDateString() : 'N/A'
                    }
                });
            }
        });

        // Map Inventory Expiry
        inventoryItems.forEach(i => {
            if (i.expiry) {
                events.push({
                    id: i._id,
                    type: 'inventory',
                    title: `Stock Exp: ${i.name}`,
                    date: i.expiry,
                    status: 'Active',
                    priority: 'High',
                    details: {
                        subtitle: `Code: ${i.code || 'N/A'}`,
                        stock: `${i.qty} ${i.unit}`
                    }
                });
            }
        });

        // Map Raw Material Expiry
        rawMaterials.forEach(rm => {
            if (rm.expDate) {
                events.push({
                    id: rm._id,
                    type: 'inventory',
                    title: `RM Exp: ${rm.name}`,
                    date: rm.expDate,
                    status: 'In Stock',
                    priority: 'High',
                    details: {
                        subtitle: `Code: ${rm.code}`,
                        stock: `${rm.qty} ${rm.uom}`
                    }
                });
            }
        });

        // Map Material Request Expiry
        mrs.forEach(mr => {
            mr.items.forEach((item, idx) => {
                if (item.expDate && (!start || !end || (item.expDate >= new Date(start) && item.expDate <= new Date(end)))) {
                    events.push({
                        id: `${mr._id}_${idx}`,
                        type: 'inventory',
                        title: `MR Item Exp: ${item.itemName}`,
                        date: item.expDate,
                        status: 'Requested',
                        priority: 'Medium',
                        details: {
                            subtitle: `MR: ${mr.mrNo}`,
                            qty: `${item.qty} ${item.uom}`
                        }
                    });
                }
            });
        });

        // Map GRN Expiry
        grns.forEach(g => {
            g.items.forEach((item, idx) => {
                if (item.expDate && (!start || !end || (item.expDate >= new Date(start) && item.expDate <= new Date(end)))) {
                    events.push({
                        id: `${g._id}_${idx}`,
                        type: 'grn_expiry',
                        title: `GRN Exp: ${item.itemName}`,
                        date: item.expDate,
                        status: 'Received',
                        priority: 'High',
                        details: {
                            subtitle: `GRN: ${g.grnNumber}`,
                            supplier: g.supplierName,
                            qty: `${item.qty} ${item.uom}`
                        }
                    });
                }
            });
        });

        // Map Finished Goods Expiry
        fgs.forEach(fg => {
            if (fg.expDate) {
                events.push({
                    id: fg._id,
                    type: 'inventory',
                    title: `FG Exp: ${fg.partName}`,
                    date: fg.expDate,
                    status: 'In Stock',
                    priority: 'High',
                    details: {
                        subtitle: `Part No: ${fg.partNo}`,
                        qty: fg.qty
                    }
                });
            }
        });

        // Map Job Card Step Deadlines
        jobSteps.forEach(job => {
            job.steps.forEach((step, idx) => {
                if (step.targetDeadline && (!start || !end || (step.targetDeadline >= new Date(start) && step.targetDeadline <= new Date(end)))) {
                    events.push({
                        id: `${job._id}_step_${idx}`,
                        type: 'job',
                        title: `Step: ${step.stepName}`,
                        date: step.targetDeadline,
                        status: step.status || 'Pending',
                        priority: 'Medium',
                        details: {
                            subtitle: `${job.jobNumber} - ${job.itemId?.name || 'Item'}`,
                            description: step.description
                        }
                    });
                }
            });
        });

        // Sort by date asc
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(events);
    } catch (error) {
        console.error('Calendar Aggregation Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
