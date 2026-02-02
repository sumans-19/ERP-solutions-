const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const JobCard = require('../models/JobCard');
const Order = require('../models/Order');
const Item = require('../models/Item');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// DEBUG ROUTE - Remove after fixing
router.get('/debug-assignment/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const Employee = require('../models/Employee');
        const JobCard = require('../models/JobCard');

        let report = {
            param: employeeId,
            steps: []
        };

        // 1. Check Employee
        let searchId = employeeId;
        const isValid = require('mongoose').Types.ObjectId.isValid(employeeId);
        report.steps.push(`IsValidObjectId: ${isValid}`);

        let emp = null;
        if (isValid) emp = await Employee.findById(employeeId);
        if (!emp) emp = await Employee.findOne({ employeeId: employeeId });

        if (emp) {
            report.steps.push(`Found Employee: ${emp.fullName} (${emp.email}) ID: ${emp._id}`);
            searchId = emp._id;
        } else {
            report.steps.push(`Employee Not Found`);
        }

        // 2. Query Jobs
        const jobs = await JobCard.find({
            'steps.assignedEmployees.employeeId': searchId
        }).lean();

        report.jobCount = jobs.length;
        report.jobs = jobs.map(j => ({
            id: j._id,
            number: j.jobNumber,
            assignedSteps: j.steps
                .filter(s => s.assignedEmployees.some(ae => ae.employeeId.toString() === searchId.toString()))
                .map(s => s.stepName)
        }));

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

router.use(authenticateToken);

// Get all job cards
router.get('/', checkPermission('viewOrders'), async (req, res) => {
    try {
        const jobs = await JobCard.find()
            .populate('itemId', 'name code unit finalQualityCheck finalQualityCheckImages finalQualityCheckSampleSize')
            .populate('orderId', 'partyName poNumber')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get job card stats by stage (Unified with Item states)
router.get('/stats/state-counts', checkPermission('viewOrders'), async (req, res) => {
    try {
        // 1. Get IDs of items that have active JobCards to avoid double counting
        const activeJobItemIds = await JobCard.distinct('itemId', {
            stage: { $ne: 'Completed' }
        });

        // 2. Aggregate JobCard counts
        const jobCounts = await JobCard.aggregate([
            { $group: { _id: '$stage', count: { $sum: 1 } } }
        ]);

        // 3. Aggregate Item counts (Excluding those that have JobCards for 'New' state)
        const itemCounts = await Item.aggregate([
            {
                $match: {
                    $or: [
                        { _id: { $nin: activeJobItemIds } }, // Not in production
                        { state: { $ne: 'New' } }            // Or already moved past New in Item tracking
                    ]
                }
            },
            { $group: { _id: '$state', count: { $sum: 1 } } }
        ]);

        const stateCounts = {
            New: 0, Assigned: 0, Manufacturing: 0, Verification: 0,
            Documentation: 0, Completed: 0, Hold: 0
        };

        // Merge Item counts
        itemCounts.forEach(c => {
            if (stateCounts.hasOwnProperty(c._id)) stateCounts[c._id] += c.count;
        });

        // Merge JobCard counts
        jobCounts.forEach(c => {
            if (stateCounts.hasOwnProperty(c._id)) stateCounts[c._id] += c.count;
        });

        res.json(stateCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DEBUG ROUTE - Remove after fixing
router.get('/debug-assignment/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const Employee = require('../models/Employee');
        const JobCard = require('../models/JobCard');

        let report = {
            param: employeeId,
            steps: []
        };

        // 1. Check Employee
        let searchId = employeeId;
        const isValid = require('mongoose').Types.ObjectId.isValid(employeeId);
        report.steps.push(`IsValidObjectId: ${isValid}`);

        let emp = null;
        if (isValid) emp = await Employee.findById(employeeId);
        if (!emp) emp = await Employee.findOne({ employeeId: employeeId });

        if (emp) {
            report.steps.push(`Found Employee: ${emp.fullName} (${emp.email}) ID: ${emp._id}`);
            searchId = emp._id;
        } else {
            report.steps.push(`Employee Not Found`);
        }

        // 2. Query Jobs
        const jobs = await JobCard.find({
            'steps.assignedEmployees.employeeId': searchId
        }).lean();

        report.jobCount = jobs.length;
        report.jobs = jobs.map(j => ({
            id: j._id,
            number: j.jobNumber,
            assignedSteps: j.steps
                .filter(s => s.assignedEmployees.some(ae => ae.employeeId.toString() === searchId.toString()))
                .map(s => s.stepName)
        }));

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// Get job cards by stage (Unified view of JobCards and Items)
router.get('/state/:stage', checkPermission('viewOrders'), async (req, res) => {
    try {
        const { stage } = req.params;

        // 1. Identify which items are already in production as JobCards
        const activeJobItemIds = await JobCard.distinct('itemId', {
            stage: { $ne: 'Completed' }
        });

        // 2. Fetch JobCards
        const jobs = await JobCard.find({ stage: stage })
            .populate('itemId', 'name code unit finalQualityCheck finalQualityCheckImages finalQualityCheckSampleSize')
            .populate('orderId', 'partyName poNumber')
            .sort({ createdAt: -1 });

        // 3. Fetch Items that are effectively in this state (Unified logic)
        // If stage is 'New', only include items NOT in active production
        // If stage is something else, include Items explicitly in that state
        const itemCriteria = { state: stage };
        if (stage === 'New') {
            itemCriteria._id = { $nin: activeJobItemIds };
        }

        const items = await Item.find(itemCriteria)
            .select('-image')
            .sort({ createdAt: -1 });

        // 4. Map JobCards to UI structure
        const mappedJobs = jobs.map(j => ({
            _id: j._id,
            name: j.itemId?.name || 'Unknown Item',
            code: j.jobNumber,
            state: j.stage,
            type: 'job', // Indicator for UI logic if needed
            processes: j.steps.map(s => ({
                id: s.stepId,
                stepName: s.stepName,
                stepType: 'execution',
                status: s.status
            })),
            assignedEmployees: j.steps.filter(s => s.employeeId).map(s => ({
                processStepId: s.stepId,
                employeeName: 'Specialist',
                employeeId: s.employeeId,
                status: s.status
            })),
            holdReason: j.status === 'OnHold' ? 'Production Halted' : ''
        }));

        // 5. Map Items to UI structure
        const mappedItems = items.map(i => ({
            _id: i._id,
            name: i.name,
            code: i.code || 'SKU-NEW',
            state: i.state,
            type: 'item',
            processes: i.processes || [],
            assignedEmployees: i.assignedEmployees || [],
            holdReason: i.holdReason || ''
        }));

        // 6. Merge and Return
        res.json([...mappedJobs, ...mappedItems]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get job cards by employee ID
router.get('/employee/:employeeId', checkPermission('viewOrders'), async (req, res) => {
    try {
        const rawId = req.params.employeeId;
        const employeeId = rawId ? rawId.trim() : rawId;

        console.log(`[GET /employee/:id] Fetching jobs for employee param: '${employeeId}'`);

        const Employee = require('../models/Employee');
        let searchId = employeeId;

        // Check if the param is a valid ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(employeeId);

        // RESOLUTION LOGIC:
        // 1. If it's a valid ObjectId, we generally assume it IS the _id.
        //    We cast it immediately to ensure the query works even if the Employee lookup fails.
        if (isValidObjectId) {
            searchId = new mongoose.Types.ObjectId(employeeId);
            console.log(`[GET /employee/:id] Valid ObjectId detected. searchId set to ObjectId('${employeeId}')`);

            // Optional: Lookup just to confirm existence or get name
            // const exists = await Employee.exists({ _id: employeeId });
        } else {
            // 2. If NOT an ObjectId (e.g. "EMP002"), we MUST resolve it to an _id
            console.log(`[GET /employee/:id] Not a valid ObjectId. Attempting Custom ID lookup for '${employeeId}'...`);
            const empDoc = await Employee.findOne({ employeeId: employeeId });
            if (empDoc) {
                searchId = empDoc._id;
                console.log(`[GET /employee/:id] Resolved Custom ID '${employeeId}' to ObjectId '${searchId}'`);
            } else {
                console.log(`[GET /employee/:id] Warning: No employee found matching string '${employeeId}'. Querying as string.`);
            }
        }

        // Query nested assignedEmployees array
        // Use $in to be safe? No, let's stick to the direct match with the resolved ID.
        // We log the type being used.
        console.log(`[GET /employee/:id] Executing Query with searchId: ${searchId} (Type: ${typeof searchId === 'object' ? 'ObjectId' : 'String'})`);

        const jobs = await JobCard.find({
            'steps.assignedEmployees.employeeId': searchId
        })
            .populate('itemId', 'name code unit finalQualityCheck finalQualityCheckImages finalQualityCheckSampleSize')
            .populate('orderId', 'partyName poNumber')
            .populate('steps.assignedEmployees.employeeId', 'name fullName email')
            .sort({ createdAt: -1 });

        console.log(`[GET /employee/:id] Found ${jobs.length} jobs.`);
        res.json(jobs);
    } catch (error) {
        console.error('[GET /employee/:id] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get job card by ID
router.get('/:id', checkPermission('viewOrders'), async (req, res) => {
    try {
        const job = await JobCard.findById(req.params.id)
            .populate('itemId', 'name code unit finalQualityCheck finalQualityCheckImages finalQualityCheckSampleSize')
            .populate('orderId', 'partyName poNumber')
            .populate('steps.assignedEmployees.employeeId', 'name fullName email'); // Added this populate
        if (!job) return res.status(404).json({ message: 'Job Card not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update job card steps / employee assignment
router.patch('/:id/steps', checkPermission('editOrders'), async (req, res) => {
    try {
        const { steps } = req.body;
        const job = await JobCard.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job Card not found' });

        if (steps) {
            console.log(`Updating ${steps.length} steps for JobCard ${req.params.id}`);
            console.log('Steps Payload Sample:', JSON.stringify(steps[0]));
            // Sanitize steps to prevent CastErrors (especially for empty string or object employeeId)
            job.steps = steps.map(step => {
                let empId = step.employeeId;
                if (empId && typeof empId === 'object') {
                    empId = empId._id || empId.id || empId;
                }

                // Fix: Map simple employeeId from frontend to assignedEmployees array
                let assignedEmployees = step.assignedEmployees || [];

                // If frontend sent a new employeeId selection
                if (empId) {
                    // Check if this employee is already assigned
                    const isAssigned = assignedEmployees.some(ae =>
                        (ae.employeeId?._id || ae.employeeId)?.toString() === empId.toString()
                    );

                    if (!isAssigned) {
                        // For the current simple UI, we might want to replace the assignment 
                        // or add to it. Assuming "Assign Specialist" dropdown means *the* specialist:
                        assignedEmployees = [{
                            employeeId: empId,
                            assignedAt: new Date()
                        }];
                    }
                }

                // Remove root-level employeeId to avoid schema issues, but keep it if it's undefined
                // actually, we should just not set it on the new object if it's not in schema
                const { employeeId: _, ...stepRest } = step;

                return {
                    ...stepRest,
                    assignedEmployees
                };
            });
        }

        // Auto-update job status if all steps are completed
        const allDone = job.steps.length > 0 && job.steps.every(s => s.status === 'completed');
        if (allDone && job.status !== 'Completed') {
            job.status = 'Completed';

            try {
                // Trigger automatic transition for the Parent Order
                const allOrderJobs = await JobCard.find({ orderId: job.orderId });
                // Check if every OTHER job is already completed (current one is already set to Completed in memory)
                const allOrderJobsDone = allOrderJobs.every(j =>
                    j._id.equals(job._id) ? true : j.status === 'Completed'
                );

                if (allOrderJobsDone) {
                    console.log(`🎯 Order ${job.orderId} Production Finished. Moving to MFGCompleted.`);
                    await Order.findByIdAndUpdate(job.orderId, { orderStage: 'MFGCompleted' });
                }
            } catch (err) {
                console.error('Error updating parent order status:', err);
            }
        } else if (job.steps.some(s => s.status === 'in-progress' || s.status === 'completed')) {
            job.status = 'InProgress';

            try {
                // Also move order to Processing if it's currently at a lower stage
                await Order.updateOne(
                    { _id: job.orderId, orderStage: { $in: ['New', 'Mapped', 'Assigned'] } },
                    { $set: { orderStage: 'Processing' } }
                );
            } catch (err) {
                console.error('Error updating order to Processing:', err);
            }
        }

        await job.save();
        res.json(job);
    } catch (error) {
        console.error('CRITICAL ERROR in PATCH /api/job-cards/:id/steps:');
        console.error(error);
        res.status(500).json({
            message: 'Server failed to update job card steps',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Split Job Card (Partial production)
router.post('/:id/split', checkPermission('editOrders'), async (req, res) => {
    try {
        const { splitQty } = req.body;
        const originalJob = await JobCard.findById(req.params.id);

        if (!originalJob) return res.status(404).json({ message: 'Job Card not found' });
        if (splitQty >= originalJob.quantity) {
            return res.status(400).json({ message: 'Split quantity must be less than current quantity' });
        }

        const remainingQty = originalJob.quantity - splitQty;
        originalJob.quantity = splitQty;
        await originalJob.save();

        // Create new job card for remaining quantity
        // Improved numbering for split jobs
        const splitSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        const newJobNumber = `${originalJob.jobNumber}-S${splitSuffix}`;
        const newJobCard = new JobCard({
            jobNumber: newJobNumber,
            orderId: originalJob.orderId,
            orderItemId: originalJob.orderItemId,
            itemId: originalJob.itemId,
            quantity: remainingQty,
            priority: originalJob.priority,
            deliveryDate: originalJob.deliveryDate,
            steps: originalJob.steps.map(s => ({ ...s.toObject(), status: 'pending', startTime: null, endTime: null })),
            status: 'Created'
        });

        const savedNewJob = await newJobCard.save();

        // Update parent order item batches
        const order = await Order.findById(originalJob.orderId);
        const orderItem = order.items.id(originalJob.orderItemId);

        // Update original batch qty in order item record
        const batch = orderItem.jobBatches.find(b => b.jobId.toString() === originalJob._id.toString());
        if (batch) batch.batchQty = splitQty;

        // Add new batch record
        orderItem.jobBatches.push({
            jobId: savedNewJob._id,
            jobNumber: savedNewJob.jobNumber,
            batchQty: savedNewJob.quantity,
            status: 'Pending'
        });

        await order.save();

        res.status(201).json({
            message: 'Job split successfully',
            originalJob,
            newJob: savedNewJob
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle substep status within a job card step
router.patch('/:id/steps/:stepId/substeps/:subStepId/toggle', checkPermission('editOrders'), async (req, res) => {
    try {
        const { status } = req.body;
        const job = await JobCard.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job Card not found' });

        const step = job.steps.find(s => String(s.stepId) === String(req.params.stepId));
        if (!step) return res.status(404).json({ message: 'Step not found' });

        const substep = step.subSteps.find(ss => String(ss.id) === String(req.params.subStepId));
        if (!substep) return res.status(404).json({ message: 'Substep not found' });

        substep.status = status;
        await job.save();
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
