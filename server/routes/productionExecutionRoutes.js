const express = require('express');
const router = express.Router();
const JobCard = require('../models/JobCard');
const Employee = require('../models/Employee');
const Item = require('../models/Item');
const Order = require('../models/Order');
const WIPStock = require('../models/WIPStock');
const FinishedGood = require('../models/FinishedGood');
const RejectedGood = require('../models/RejectedGood');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const { User } = require('../models/User'); // Ensure User model is available for ID bridge

router.use(authenticateToken);

// 0. Get all Open Jobs
router.get('/open-jobs', async (req, res) => {
    try {
        const jobs = await JobCard.find({
            'steps.isOpenJob': true,
            'steps.status': 'pending'
        }).populate('itemId', 'name code unit finalQualityCheck finalQualityCheckImages finalQualityCheckSampleSize').populate('orderId', 'partyName poNumber');

        // Filter out steps that are not open
        const openSteps = [];
        jobs.forEach(job => {
            job.steps.forEach(step => {
                if (step.isOpenJob && step.status === 'pending') {
                    openSteps.push({
                        jobCardId: job._id,
                        jobNumber: job.jobNumber,
                        itemId: job.itemId?._id,
                        itemName: job.itemId?.name,
                        itemCode: job.itemId?.code,
                        quantity: job.quantity,
                        stepId: step.stepId,
                        stepName: step.stepName,
                        partyName: job.orderId?.partyName,
                        poNumber: job.orderId?.poNumber
                    });
                }
            });
        });

        res.json(openSteps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 1. Accept Open Job
router.post('/jobs/:jobId/steps/:stepId/accept', async (req, res) => {
    try {
        const { jobId, stepId } = req.params;
        // Robust ID fetch: Try req.user (from auth middleware) first, then header
        const employeeId = req.user?.id || req.user?._id || req.headers['x-user-id'];

        console.log(`[Accept Job] Request from User '${employeeId}' for Job '${jobId}', Step '${stepId}'`);

        if (!employeeId) {
            return res.status(401).json({ message: 'User identity not found in request' });
        }

        const job = await JobCard.findById(jobId);
        if (!job) {
            console.log('[Accept Job] Job not found in DB');
            return res.status(404).json({ message: 'Job Card not found' });
        }

        const step = job.steps.find(s => s.stepId === stepId);
        if (!step) {
            console.log(`[Accept Job] Step ${stepId} not found in job.`);
            return res.status(404).json({ message: 'Step not found' });
        }

        // Logic Check 1: Is it Open?
        if (!step.isOpenJob) {
            console.log(`[Accept Job] REJECT: Step not Open. isOpenJob=${step.isOpenJob}, Status=${step.status}`);
            return res.status(400).json({
                message: 'This job is not open for acceptance. It may have been assigned or closed.',
                debug: { isOpen: step.isOpenJob, status: step.status }
            });
        }

        // Logic Check 2: Already Assigned?
        const isAssigned = step.assignedEmployees.some(a => a.employeeId && a.employeeId.toString() === employeeId.toString());
        if (isAssigned) {
            console.log(`[Accept Job] REJECT: User ${employeeId} already assigned.`);
            return res.status(400).json({ message: 'You have already accepted this job.' });
        }

        // Success - Assign User
        step.assignedEmployees.push({
            employeeId: employeeId,
            assignedAt: new Date(),
            name: req.user?.name || 'Worker' // snapshot name if available
        });

        // Auto-close open job status logic
        // If we want multiple people to accept, we might keep it open. 
        // But typically "Accept Open Job" claims it. 
        // Let's Assume strict claiming for now unless "multiple employees" feature is fully active.
        // For now, let's keep it open if the "Multiple Employees" flag is set (future proofing), else close it.
        // Current logic: Close it to prevent double booking for now.
        step.isOpenJob = false;

        await job.save();
        console.log(`[Accept Job] SUCCESS: Assigned ${employeeId} to Step ${stepId}`);

        res.json({ message: 'Job accepted successfully', job });
    } catch (error) {
        console.error('[Accept Job] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// 2. Execute Step (Start / Complete / Update)
router.patch('/jobs/:jobId/steps/:stepId/execute', async (req, res) => {
    try {
        const { jobId, stepId } = req.params;
        const { status, received, processed, rejected, remarks } = req.body;
        // Robust ID fetch: Try req.user first, then header
        const employeeId = req.user?.id || req.user?._id || req.headers['x-user-id'];

        console.log(`[Execute Job] Request from User '${employeeId}' for Job '${jobId}', Step '${stepId}' Status: ${status}`);

        const job = await JobCard.findById(jobId).populate('itemId').populate('orderId');
        if (!job) return res.status(404).json({ message: 'Job Card not found' });

        // Fix: Use loose equality logic for stepId lookup
        const stepIndex = job.steps.findIndex(s => s.stepId == stepId);
        if (stepIndex === -1) return res.status(404).json({ message: 'Step not found' });

        const step = job.steps[stepIndex];

        // Access Control
        let validIDs = [employeeId.toString()];
        try {
        } catch (err) {
            console.error('Error in ID bridge resolution:', err);
        }

        const isAssigned = step.assignedEmployees.some(a => {
            const assignedId = a.employeeId?._id || a.employeeId;
            const assignedStr = assignedId ? assignedId.toString() : '';
            return validIDs.includes(assignedStr);
        });

        if (!isAssigned) {
            console.log('ACCESS DENIED: Required:', JSON.stringify(step.assignedEmployees.map(a => a.employeeId)), 'Provided (Resolved):', validIDs);
            return res.status(403).json({
                message: 'You are not assigned to this step',
                debug: {
                    userId: employeeId,
                    receivedHeader: req.headers['x-user-id'],
                    validIDs: validIDs,
                    assigned: step.assignedEmployees
                }
            });
        }

        // Dependency check: Previous steps must be completed
        if (stepIndex > 0) {
            const prevStep = job.steps[stepIndex - 1];
            if (prevStep.status !== 'completed') {
                console.error(`[Dependency Error] Job: ${job.jobNumber}, Step: ${step.stepName} (${stepIndex}) blocked by PrevStep: ${prevStep.stepName} (${stepIndex - 1}) Status: ${prevStep.status}`);
                return res.status(400).json({
                    message: `Previous step '${prevStep.stepName}' must be completed first. Current status: ${prevStep.status}`,
                    debug: {
                        currentStep: step.stepName,
                        prevStep: prevStep.stepName,
                        prevStatus: prevStep.status
                    }
                });
            }
        }

        // Quantity validation if completing
        if (status === 'completed') {
            if (received === undefined || processed === undefined || rejected === undefined) {
                return res.status(400).json({ message: 'All quantities are mandatory for completion' });
            }
            if (Number(processed) + Number(rejected) > Number(received)) {
                return res.status(400).json({ message: 'Processed + Rejected quantity cannot exceed Received quantity' });
            }

            step.endTime = new Date();
        }

        if (status === 'in-progress' && !step.startTime) {
            step.startTime = new Date();
        }

        // Update step status and quantities
        const oldStatus = step.status;
        step.status = status || step.status;
        const processedVal = processed !== undefined ? Number(processed) : step.quantities.processed;
        const rejectedVal = rejected !== undefined ? Number(rejected) : step.quantities.rejected;
        const receivedVal = received !== undefined ? Number(received) : step.quantities.received;

        if (received !== undefined) step.quantities.received = receivedVal;
        if (processed !== undefined) step.quantities.processed = processedVal;
        if (rejected !== undefined) step.quantities.rejected = rejectedVal;
        if (remarks !== undefined) step.remarks = remarks;

        // --- PHASE 3: AUTOMATED SYNC LOGIC (WIP & Stock Tracking) ---
        if (status === 'completed' || status === 'in-progress') {
            const item = await Item.findById(job.itemId);
            const totalRejected = job.steps.reduce((sum, s) => sum + (s.quantities?.rejected || 0), 0);

            // 1. Update WIP Stock for tracking in Inventory View
            try {
                await WIPStock.findOneAndUpdate(
                    { jobNo: job.jobNumber },
                    {
                        partNo: item?.code || 'N/A',
                        partName: item?.name || 'Unknown',
                        qty: status === 'completed' ? processedVal : (step.quantities.received || job.quantity),
                        initialQty: job.quantity,
                        processedQty: status === 'completed' ? processedVal : (stepIndex > 0 ? job.steps[stepIndex - 1].quantities.processed : 0),
                        rejectedQty: totalRejected,
                        currentStage: `${step.stepName}${status === 'in-progress' ? ' (Processing)' : ''}`,
                        thickness: item?.thickness || '',
                        uom: item?.unit || 'Unit',
                        poNo: job.orderId?.poNumber || 'N/A'
                    },
                    { upsert: true, new: true }
                );
                console.log(`[Sync] Updated WIP: Job=${job.jobNumber}, Status=${status}, Pass=${processedVal}, Rej=${totalRejected}`);
            } catch (wipErr) {
                console.error('[Sync] WIP Update failed:', wipErr);
            }

            // 2. Logic specific to COMPLETION
            if (status === 'completed') {
                // ALWAYS Propagate Quantity Transfer to NEXT Step (Ensures flow is corrected if counts change)
                if (stepIndex < job.steps.length - 1) {
                    const nextStep = job.steps[stepIndex + 1];
                    nextStep.quantities.received = processedVal;
                    console.log(`[Sync] Propagated Received Qty to Next Step (${nextStep.stepName}): ${processedVal}`);
                }

                // Automated Rejection Movement (Only log to RejectedGood on first transition)
                if (oldStatus !== 'completed' && rejectedVal > 0) {
                    try {
                        const rejectedEntry = new RejectedGood({
                            partNo: item?.code || 'N/A',
                            partName: item?.name || 'Unknown',
                            qty: rejectedVal,
                            reason: `Rejected during step: ${step.stepName}`,
                            poNo: job.orderId?.toString() || '',
                            jobNo: job.jobNumber,
                            stepName: step.stepName,
                            employeeName: req.user?.name || req.user?.username || 'Worker',
                            mfgDate: new Date()
                        });
                        await rejectedEntry.save();
                    } catch (rejErr) {
                        console.error('[Sync] Rejection log failed:', rejErr);
                    }
                }
            }
        }

        await job.save();
        res.json({ message: 'Step updated successfully', job });
    } catch (error) {
        console.error('Execute step error:', error);
        res.status(500).json({ message: error.message });
    }
});

// 3. Complete Outward Work
router.patch('/jobs/:jobId/steps/:stepId/complete-outward', async (req, res) => {
    try {
        const { jobId, stepId } = req.params;
        const { receivedQty, rejectedQty, remarks, returnDate } = req.body;

        const job = await JobCard.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job Card not found' });

        const step = job.steps.find(s => s.stepId === stepId);
        if (!step) return res.status(404).json({ message: 'Step not found' });

        if (!step.isOutward) {
            return res.status(400).json({ message: 'This is not an outward work step' });
        }

        step.quantities = {
            received: step.quantities?.received || 0, // This is what we sent out? Actually, maybe received here means what we got back.
            processed: receivedQty,
            rejected: rejectedQty
        };
        step.remarks = remarks;
        step.outwardDetails.actualReturnDate = returnDate || new Date();
        step.status = 'completed';
        step.endTime = new Date();

        await job.save();
        res.json({ message: 'Outward work completed', job });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Submit FQC Results & Stock Finalization
router.post('/jobs/:jobId/fqc', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { results, processed, rejected, stepId, employeeId } = req.body; // Array of { parameterId, parameterName, samples: [], remarks }

        const job = await JobCard.findById(jobId).populate('itemId').populate('orderId');
        if (!job) return res.status(404).json({ message: 'Job Card not found' });

        // Update FQC parameters in JobCard
        results.forEach(res => {
            const param = job.fqcParameters.find(p => (p._id && p._id.toString() === res.parameterId?.toString()) || p.parameterName === res.parameterName);
            if (param) {
                param.samples = (res.samples || []).map((reading, i) => ({
                    sampleNumber: i + 1,
                    reading: reading?.toString() || ''
                }));
                param.remarks = res.remarks;
            }
        });

        // Mark the specific FQC step as completed (using stepId if provided)
        let fqcStep = null;
        if (stepId) {
            fqcStep = job.steps.find(s => s._id.toString() === stepId.toString() || s.stepId == stepId);
        }

        // Fallback to searching by type/name if stepId not provided or not found
        if (!fqcStep) {
            fqcStep = job.steps.find(s =>
                s.stepType === 'testing' ||
                s.stepName.toLowerCase().includes('qc') ||
                s.stepName.toLowerCase().includes('quality check')
            );
        }

        if (fqcStep) {
            fqcStep.status = 'completed';
            fqcStep.endTime = new Date();
            fqcStep.quantities.processed = processed !== undefined ? Number(processed) : fqcStep.quantities.processed;
            fqcStep.quantities.rejected = rejected !== undefined ? Number(rejected) : fqcStep.quantities.rejected;
            console.log(`[FQC Submit] Marked step '${fqcStep.stepName}' (ID: ${fqcStep.stepId || fqcStep._id}) as COMPLETED`);
        } else {
            console.warn(`[FQC Submit] No FQC step found to complete for job ${job.jobNumber}`);
        }

        // --- AUTOMATED STOCK FINALIZATION (FG & WIP Removal) ---
        // 1. Move to Finished Goods
        try {
            const item = job.itemId;
            // Use provided 'processed' qty as final qty, fallback to last mfg step
            const mfgSteps = job.steps.filter(s => s.stepType !== 'testing' && !s.stepName.toLowerCase().includes('qc'));
            const finalQty = processed !== undefined ? Number(processed) : (mfgSteps.length > 0 ? mfgSteps[mfgSteps.length - 1].quantities.processed : job.quantity);

            // Use findOneAndUpdate with upsert to prevent duplicates
            await FinishedGood.findOneAndUpdate(
                { jobNo: job.jobNumber },
                {
                    partNo: item?.code || 'N/A',
                    partName: item?.name || 'Unknown',
                    qty: finalQty,
                    mfgDate: new Date(),
                    poNo: job.orderId?.poNumber || '',
                    jobNo: job.jobNumber,
                    batchCode: job.jobNumber,
                    initialQty: job.quantity
                },
                { upsert: true, new: true }
            );

            // 2. Automated Rejection Movement during FQC
            if (rejected !== undefined && Number(rejected) > 0) {
                try {
                    const rejectedEntry = new RejectedGood({
                        partNo: item?.code || 'N/A',
                        partName: item?.name || 'Unknown',
                        qty: Number(rejected),
                        reason: `Rejected during Final Quality Check (FQC)`,
                        poNo: job.orderId?.poNumber || '',
                        jobNo: job.jobNumber,
                        stepName: 'Final Quality Check',
                        employeeName: req.user?.name || req.user?.username || 'Quality Inspector',
                        mfgDate: new Date()
                    });
                    await rejectedEntry.save();
                    console.log(`[FQC] Moved ${rejected} rejected units to Rejected Inventory.`);
                } catch (rejErr) {
                    console.error('[FQC] Failed to log rejection:', rejErr);
                }
            }

            // 3. Update Item's main Master Stock
            if (item) {
                item.currentStock = (item.currentStock || 0) + finalQty;
                await item.save();
            }

            // 4. Remove from WIP
            await WIPStock.deleteOne({ jobNo: job.jobNumber });

            console.log(`[Sync] Job ${job.jobNumber} finalized. Moved ${finalQty} to FG Stock. WIP cleared.`);
        } catch (fgErr) {
            console.error('[Sync] FG Finalization failed:', fgErr);
        }

        // Auto-transition stage
        job.stage = 'Completed';
        job.status = 'Completed';
        console.log(`[FQC Submit] Set job ${job.jobNumber} status to Completed`);
        job.stageHistory.push({
            stage: 'Completed',
            description: 'FQC Results Submitted and Stock Finalized'
        });

        // Retry logic for VersionError
        let saved = false;
        let retries = 3;
        while (!saved && retries > 0) {
            try {
                await job.save();
                saved = true;
            } catch (err) {
                if (err.name === 'VersionError' && retries > 1) {
                    console.log(`[FQC] VersionError encountered, retrying... (${retries} left)`);
                    const freshJob = await JobCard.findById(jobId);
                    if (freshJob) {
                        // Re-apply changes to fresh instance
                        freshJob.stage = 'Completed';
                        freshJob.status = 'Completed';

                        // Copy FQC values again
                        if (req.body.results) {
                            req.body.results.forEach(res => {
                                const p = freshJob.fqcParameters.find(p => (p._id && p._id.toString() === res.parameterId?.toString()) || p.parameterName === res.parameterName);
                                if (p) {
                                    p.samples = (res.samples || []).map((reading, i) => ({ sampleNumber: i + 1, reading: reading?.toString() || '' }));
                                    p.remarks = res.remarks;
                                }
                            });
                        }

                        // Mark specific step in freshJob
                        let freshFqcStep = null;
                        if (stepId) {
                            freshFqcStep = freshJob.steps.find(s => s._id.toString() === stepId.toString() || s.stepId == stepId);
                        }
                        if (!freshFqcStep) {
                            freshFqcStep = freshJob.steps.find(s => s.stepType === 'testing' || s.stepName.toLowerCase().includes('qc') || s.stepName.toLowerCase().includes('quality check'));
                        }

                        if (freshFqcStep) {
                            freshFqcStep.status = 'completed';
                            freshFqcStep.endTime = new Date();
                            freshFqcStep.quantities.processed = processed !== undefined ? Number(processed) : freshFqcStep.quantities.processed;
                            freshFqcStep.quantities.rejected = rejected !== undefined ? Number(rejected) : freshFqcStep.quantities.rejected;
                        }

                        await freshJob.save();
                        saved = true;
                    }
                } else {
                    throw err;
                }
                retries--;
            }
        }

        res.json({ message: 'FQC Results saved and stock finalized successfully', job });
    } catch (error) {
        console.error('FQC Submit Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
