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
        const { start, end, employeeId } = req.query;
        let dateFilter = {};

        if (start && end) {
            dateFilter = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }

        const isEmployeeView = !!employeeId;

        // 1. Fetch Orders (Delivery Date) - Skip for employee view to reduce clutter
        let orders = [];
        if (!isEmployeeView) {
            const orderQuery = start && end ? { estimatedDeliveryDate: dateFilter } : {};
            orders = await Order.find(orderQuery)
                .select('partyName poNumber estimatedDeliveryDate status items totalAmount')
                .lean();
        }

        // 2. Fetch Job Cards (Main Delivery Date)
        let jobQueryMain = start && end ? { deliveryDate: dateFilter } : {};
        if (isEmployeeView) {
            jobQueryMain = {
                ...jobQueryMain,
                $or: [
                    { 'steps.assignedEmployees.employeeId': employeeId },
                    { 'steps.outwardDetails.internalEmployeeId': employeeId }
                ]
            };
        }
        const jobs = await JobCard.find(jobQueryMain)
            .populate('itemId', 'name code')
            .populate('orderId', 'partyName')
            .select('jobNumber itemId quantity status deliveryDate priority')
            .lean();

        // 3. Fetch Tasks (Due Date)
        let taskQuery = start && end ? { dueDate: dateFilter } : {};
        if (isEmployeeView) {
            taskQuery.employeeId = employeeId;
        }
        const tasks = await Task.find(taskQuery)
            .select('title priority status dueDate employeeId')
            .lean();

        // 4. Fetch Party Follow-ups (Meeting Date) - Skip for employee view
        let followUps = [];
        if (!isEmployeeView) {
            const followUpQuery = start && end ? { meetingDateTime: dateFilter } : {};
            followUps = await PartyFollowUp.find(followUpQuery)
                .select('partyName meetingDateTime remarks flag')
                .lean();
        }

        // 5. Fetch Todos (Deadline or Start Date)
        let todoQuery = start && end ? {
            $or: [
                { deadlineDate: dateFilter },
                { date: dateFilter }
            ]
        } : {};
        if (isEmployeeView) {
            todoQuery.assignedTo = employeeId;
        }
        const todos = await Todo.find(todoQuery)
            .select('taskName deadlineDate date status assignmentName')
            .lean();

        // 6-10. Global Data (Inventory, FG, RM, MR, GRN) - Skip for employee view unless requested
        let inventoryItems = [];
        let fgs = [];
        let grns = [];
        let rawMaterials = [];
        let mrs = [];

        if (!isEmployeeView) {
            const inventoryQuery = start && end ? { expiry: dateFilter } : {};
            inventoryItems = await Inventory.find(inventoryQuery).select('name code qty unit expiry').lean();

            const fgQuery = start && end ? { expDate: dateFilter } : {};
            fgs = await FinishedGood.find(fgQuery).select('partName partNo qty expDate').lean();

            const grnQuery = start && end ? { 'items.expDate': dateFilter } : {};
            grns = await GRN.find(grnQuery).select('grnNumber supplierName items receiveDate').lean();

            const rmQuery = start && end ? { expDate: dateFilter } : {};
            rawMaterials = await RawMaterial.find(rmQuery).select('name code qty uom expDate').lean();

            const mrQuery = start && end ? { 'items.expDate': dateFilter } : {};
            mrs = await MaterialRequest.find(mrQuery).select('mrNo items requestDate').lean();
        }

        // 11. Fetch Job Card Step Deadlines
        let jobStepQuery = start && end ? { 'steps.targetDeadline': dateFilter } : {};
        if (isEmployeeView) {
            jobStepQuery = {
                ...jobStepQuery,
                $or: [
                    { 'steps.assignedEmployees.employeeId': employeeId },
                    { 'steps.outwardDetails.internalEmployeeId': employeeId }
                ]
            };
        }
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
