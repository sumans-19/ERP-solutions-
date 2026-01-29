const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET /api/employees - Fetch all employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().lean();
        res.json(employees);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/employees/email/:email - Fetch employee by email
router.get('/email/:email', async (req, res) => {
    try {
        const employee = await Employee.findOne({ email: req.params.email.toLowerCase() }).lean();
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
    const { employeeId, fullName, email, dateJoined, status } = req.body;

    try {
        // Check for existing ID or Email
        const existingEmp = await Employee.findOne({ $or: [{ email }, { employeeId }] });
        if (existingEmp) {
            return res.status(400).json({ message: 'Employee with this ID or Email already exists' });
        }

        const newEmployee = new Employee({
            employeeId,
            fullName,

            email,
            dateJoined: dateJoined || new Date(),
            status: status || 'Active',
            tasks: [],
            items: []
        });

        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(updatedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH /api/employees/:id/status - Toggle status (Soft Delete concept)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body; // Expect 'Active' or 'Inactive'

    if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Use Active or Inactive.' });
    }

    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(updatedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/employees/:id - Optional hard delete (if needed later)
router.delete('/:id', async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/employees/:id/assignments - Fetch detailed assignments from Items
router.get('/:id/assignments', async (req, res) => {
    try {
        const JobCard = require('../models/JobCard');

        // Find all JobCards where this employee is assigned to any step
        const jobs = await JobCard.find({
            'steps.employeeId': req.params.id
        })
            .populate('itemId', 'name code')
            .lean();

        // Extract and format assignments
        const assignments = [];

        for (const job of jobs) {
            if (job.steps && Array.isArray(job.steps)) {
                // Filter steps for this employee
                const employeeSteps = job.steps.filter(s =>
                    s.employeeId && s.employeeId.toString() === req.params.id
                );

                for (const step of employeeSteps) {
                    assignments.push({
                        itemId: job.itemId?._id || job._id, // Fallback if populate fails
                        itemName: job.itemId?.name || 'Unknown Item',
                        itemCode: job.itemId?.code || job.jobNumber,
                        jobId: job._id,
                        jobNumber: job.jobNumber,
                        itemState: job.stage, // use job stage
                        processStepId: step.stepId,
                        stepName: step.stepName || 'Manufacturing Step',
                        status: step.status || 'pending',
                        assignedAt: step.assignedAt || job.createdAt,
                        targetDeadline: step.targetDeadline,
                        completedAt: step.endTime
                    });
                }
            }
        }

        // Sort by assigned date (newest first)
        assignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching employee assignments:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employees/sync-assignments - Sync currentAssignments from Item.assignedEmployees
router.post('/sync-assignments', async (req, res) => {
    try {
        const Item = require('../models/Item');
        const items = await Item.find({ 'assignedEmployees.0': { $exists: true } }).lean();
        const employees = await Employee.find({});

        console.log(`[Sync] Starting synchronization for ${items.length} items with assignments`);

        // Clear all current assignments first to avoid duplicates and ensure a fresh sync
        for (let emp of employees) {
            emp.currentAssignments = [];
            emp.calculatedStatus = 'Available';
        }

        let syncCount = 0;
        for (let item of items) {
            for (let ae of item.assignedEmployees) {
                const emp = employees.find(e => e._id.toString() === ae.employeeId?.toString());
                if (emp) {
                    const step = item.processes.find(p => p.id === ae.processStepId);
                    emp.currentAssignments.push({
                        orderId: item._id.toString(),
                        processName: step ? step.stepName : 'Manufacturing Step',
                        assignedAt: ae.assignedAt || new Date()
                    });
                    emp.calculatedStatus = 'Busy';
                    syncCount++;
                }
            }
        }

        // Save all updated employees
        for (let emp of employees) {
            await emp.save();
        }

        res.json({ message: 'Synchronization complete', syncedTasks: syncCount, employeesUpdated: employees.length });
    } catch (err) {
        console.error('Error during sync:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
