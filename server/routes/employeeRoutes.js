const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET /api/employees - Fetch all employees with Workload Counts
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { empId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$$empId', '$processAssignments.employeeId'] } } }
                    ],
                    as: 'assignedOrders'
                }
            },
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'assignedItems'
                }
            },
            {
                $project: {
                    _id: 1,
                    employeeId: 1,
                    fullName: 1,
                    email: 1,

                    status: 1,
                    dateJoined: 1,
                    assignedOrdersCount: { $size: '$assignedOrders' },
                    assignedItemsCount: { $size: '$assignedItems' },
                    lastAssignedDate: { $max: '$assignedOrders.createdAt' },
                    // Pass full arrays for details view
                    assignedOrders: 1,
                    assignedItems: 1
                }
            },
            {
                $addFields: {
                    calculatedStatus: {
                        $cond: {
                            if: { $gt: ['$assignedOrdersCount', 0] },
                            then: 'Busy',
                            else: 'Available'
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(employees);
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

module.exports = router;
