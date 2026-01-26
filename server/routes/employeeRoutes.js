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
        const Item = require('../models/Item');
        // Find all items where this employee is in the assignedEmployees array
        const items = await Item.find({
            'assignedEmployees.employeeId': req.params.id
        }).select('name code assignedEmployees processes state').lean();

        // Extract and format assignments for this specific employee
        const assignments = items.flatMap(item => {
            return item.assignedEmployees
                .filter(ae => ae.employeeId === req.params.id)
                .map(ae => {
                    const processStep = item.processes.find(p => p.id === ae.processStepId);
                    return {
                        itemId: item._id,
                        itemName: item.name,
                        itemCode: item.code,
                        itemState: item.state,
                        processStepId: ae.processStepId,
                        stepName: processStep ? processStep.stepName : 'Unknown',
                        status: ae.status,
                        assignedAt: ae.assignedAt,
                        expectedCompletionDate: ae.expectedCompletionDate,
                        completedAt: ae.completedAt
                    };
                });
        });

        // Sort by assigned date (newest first)
        assignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching employee assignments:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
