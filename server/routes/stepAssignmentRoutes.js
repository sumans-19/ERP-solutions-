const express = require('express');
const router = express.Router();
const StepAssignment = require('../models/StepAssignment');
const Audit = require('../models/audit');
const Employee = require('../models/Employee');
const Item = require('../models/Item');
const Order = require('../models/Order');

// Helper function to log audit
const logAudit = async (jobNo, itemName, mfgstepName, assignedTo, status) => {
    try {
        const audit = new Audit({
            jobNo,
            itemName,
            mfgstepName,
            assignedTo,
            status
        });
        await audit.save();
    } catch (err) {
        console.error('Error logging audit:', err.message);
    }
};

// GET /api/step-assignments - Get all step assignments
router.get('/', async (req, res) => {
    try {
        const assignments = await StepAssignment.find()
            .populate('itemId', 'itemName itemCode')
            .populate('orderId', 'poNumber customerName')
            .populate('assignedEmployeeId', 'fullName employeeId email')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/step-assignments/by-employee/:employeeId - Get assignments for specific employee
router.get('/by-employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const assignments = await StepAssignment.find({ assignedEmployeeId: employeeId })
            .populate('itemId', 'itemName itemCode')
            .populate('orderId', 'poNumber customerName')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/step-assignments/by-item/:itemId - Get all step assignments for an item
router.get('/by-item/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const assignments = await StepAssignment.find({ itemId })
            .populate('assignedEmployeeId', 'fullName employeeId email')
            .sort({ manufacturingStepNumber: 1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/step-assignments/by-order/:orderId - Get all step assignments for an order
router.get('/by-order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const assignments = await StepAssignment.find({ orderId })
            .populate('itemId', 'itemName')
            .populate('assignedEmployeeId', 'fullName employeeId')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/step-assignments - Create new step assignment
router.post('/', async (req, res) => {
    try {
        const { jobNo, itemId, orderId, itemName, manufacturingStepNumber, stepName, assignedEmployeeId, employeeName } = req.body;

        // Validate required fields
        if (!jobNo || !itemId || !orderId || !manufacturingStepNumber || !assignedEmployeeId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if employee exists
        const employee = await Employee.findById(assignedEmployeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check for duplicate assignment (same step + same employee in same item)
        const existingAssignment = await StepAssignment.findOne({
            itemId,
            manufacturingStepNumber,
            assignedEmployeeId
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'This employee is already assigned to this manufacturing step' });
        }

        const newAssignment = new StepAssignment({
            jobNo,
            itemId,
            orderId,
            itemName,
            manufacturingStepNumber,
            stepName,
            assignedEmployeeId,
            employeeName: employeeName || employee.fullName,
            stepStatus: 'Pending'
        });

        const savedAssignment = await newAssignment.save();

        // Log audit
        await logAudit(jobNo, itemName, stepName, assignedEmployeeId, 'Pending');

        res.status(201).json(savedAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/step-assignments/:assignmentId - Update step assignment
router.put('/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { stepStatus, startedAt, completedAt, notes, qualityCheckPassed, qualityCheckNotes } = req.body;

        const assignment = await StepAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Update fields
        if (stepStatus) {
            assignment.stepStatus = stepStatus;

            // Auto set timestamps
            if (stepStatus === 'Processing' && !assignment.startedAt) {
                assignment.startedAt = new Date();
            }
            if (stepStatus === 'Done' && !assignment.completedAt) {
                assignment.completedAt = new Date();
            }
        }

        if (startedAt) assignment.startedAt = startedAt;
        if (completedAt) assignment.completedAt = completedAt;
        if (notes !== undefined) assignment.notes = notes;
        if (qualityCheckPassed !== undefined) assignment.qualityCheckPassed = qualityCheckPassed;
        if (qualityCheckNotes !== undefined) assignment.qualityCheckNotes = qualityCheckNotes;

        const updatedAssignment = await assignment.save();

        // Log audit
        await logAudit(assignment.jobNo, assignment.itemName, assignment.stepName, assignment.assignedEmployeeId, stepStatus || assignment.stepStatus);

        res.json(updatedAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/step-assignments/:assignmentId/reassign - Reassign to different employee
router.put('/:assignmentId/reassign', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { newEmployeeId, newEmployeeName } = req.body;

        if (!newEmployeeId) {
            return res.status(400).json({ message: 'New employee ID is required' });
        }

        const assignment = await StepAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if new employee exists
        const employee = await Employee.findById(newEmployeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check for duplicate assignment
        const existingAssignment = await StepAssignment.findOne({
            itemId: assignment.itemId,
            manufacturingStepNumber: assignment.manufacturingStepNumber,
            assignedEmployeeId: newEmployeeId,
            _id: { $ne: assignmentId }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'This employee is already assigned to this manufacturing step' });
        }

        const oldEmployeeId = assignment.assignedEmployeeId;
        assignment.assignedEmployeeId = newEmployeeId;
        assignment.employeeName = newEmployeeName || employee.fullName;
        assignment.stepStatus = 'Pending';
        assignment.startedAt = null;
        assignment.completedAt = null;

        const updatedAssignment = await assignment.save();

        // Log audit
        await logAudit(assignment.jobNo, assignment.itemName, `${assignment.stepName} (Reassigned from ${oldEmployeeId})`, newEmployeeId, 'Pending');

        res.json(updatedAssignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/step-assignments/:assignmentId - Delete assignment
router.delete('/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await StepAssignment.findByIdAndDelete(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Log audit
        await logAudit(assignment.jobNo, assignment.itemName, `${assignment.stepName} (Deleted)`, assignment.assignedEmployeeId, 'Deleted');

        res.json({ message: 'Assignment deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/step-assignments/analytics/employee-workload - Get employee workload
router.get('/analytics/employee-workload', async (req, res) => {
    try {
        const workload = await StepAssignment.aggregate([
            {
                $group: {
                    _id: '$assignedEmployeeId',
                    employeeName: { $first: '$employeeName' },
                    totalAssignments: { $sum: 1 },
                    pendingCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Pending'] }, 1, 0] } },
                    processingCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Processing'] }, 1, 0] } },
                    qualityCheckCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Quality Check'] }, 1, 0] } },
                    doneCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Done'] }, 1, 0] } }
                }
            },
            { $sort: { totalAssignments: -1 } }
        ]);

        res.json(workload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/step-assignments/analytics/step-progress - Get step progress across all items
router.get('/analytics/step-progress', async (req, res) => {
    try {
        const progress = await StepAssignment.aggregate([
            {
                $group: {
                    _id: '$manufacturingStepNumber',
                    stepName: { $first: '$stepName' },
                    totalAssignments: { $sum: 1 },
                    pendingCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Pending'] }, 1, 0] } },
                    processingCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Processing'] }, 1, 0] } },
                    qualityCheckCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Quality Check'] }, 1, 0] } },
                    doneCount: { $sum: { $cond: [{ $eq: ['$stepStatus', 'Done'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
