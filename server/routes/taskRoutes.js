const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Get tasks for a specific employee
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const tasks = await Task.find({ employeeId })
            .populate('assignedBy', 'email role')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all tasks (Admin/Dev only)
// Get all tasks (Admin Only)
router.get('/', authenticateToken, checkPermission('manageUsers'), async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('assignedBy', 'email role')
            .sort({ createdAt: -1 });

        // Since employeeId is a String pointing to either Employee or User, 
        // we might want to manually fetch names if needed, but for now just returning IDs is safer than a failing populate.
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new task (Admin only)
router.post('/', authenticateToken, checkPermission('manageUsers'), async (req, res) => {
    try {
        const { employeeId, title, description, priority, dueDate } = req.body;

        const task = new Task({
            employeeId,
            title,
            description,
            priority,
            dueDate,
            assignedBy: req.user.id
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a task (mark complete, add notes)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updateData = {};

        if (status) {
            updateData.status = status;
            if (status === 'Completed') {
                updateData.completedAt = new Date();
            }
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('assignedBy', 'email role');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a task (Admin only)
router.delete('/:id', authenticateToken, checkPermission('manageUsers'), async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
