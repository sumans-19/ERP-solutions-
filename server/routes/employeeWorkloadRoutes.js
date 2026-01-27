const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Employee = require('../models/Employee');
const authenticateToken = require('../middleware/auth');

// GET /api/employees/workload - Get employee workload from items
router.get('/workload', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Fetching employee workload from items...');

        // Get all employees
        const employees = await Employee.find({}).lean();
        console.log(`Found ${employees.length} employees`);

        // Get all items with their manufacturing process
        const items = await Item.find({}).lean();
        console.log(`Found ${items.length} items`);

        // Initialize workload map
        const workloadMap = {};
        employees.forEach(emp => {
            const id = emp._id.toString();
            workloadMap[id] = {
                _id: emp._id,
                employeeName: emp.fullName,
                role: emp.role || emp.employeeId,
                totalAssignments: 0,
                pendingCount: 0,
                processingCount: 0,
                doneCount: 0,
                tasks: [] // Store detailed tasks
            };
        });

        // Aggregate tasks from items
        let totalTasksFound = 0;
        items.forEach(item => {
            if (item.assignedEmployees && Array.isArray(item.assignedEmployees)) {
                item.assignedEmployees.forEach(assignment => {
                    const empId = assignment.employeeId ? assignment.employeeId.toString().trim() : null;
                    if (empId && workloadMap[empId]) {
                        workloadMap[empId].totalAssignments++;
                        totalTasksFound++;

                        // Count by status
                        const status = (assignment.status || '').toLowerCase();
                        if (status === 'assigned' || status === 'pending' || status === '') {
                            workloadMap[empId].pendingCount++;
                        } else if (status === 'in-progress' || status === 'processing') {
                            workloadMap[empId].processingCount++;
                        } else if (status === 'completed' || status === 'done') {
                            workloadMap[empId].doneCount++;
                        }

                        // Find step name from item processes
                        const step = item.processes?.find(p => p.id === assignment.processStepId);

                        // Add to tasks list
                        workloadMap[empId].tasks.push({
                            itemId: item._id,
                            itemName: item.name,
                            itemCode: item.code,
                            stepId: assignment.processStepId,
                            stepName: step ? step.stepName : assignment.processStepName || 'Unknown Step',
                            status: assignment.status,
                            assignedAt: assignment.assignedAt,
                            completedAt: assignment.completedAt
                        });
                    }
                });
            }
        });

        console.log(`Total tasks found across all items: ${totalTasksFound}`);

        // Convert to array and sort
        const workload = Object.values(workloadMap).sort((a, b) => b.totalAssignments - a.totalAssignments);

        console.log('Workload summary:', workload.map(w => `${w.employeeName}: ${w.totalAssignments} tasks`));

        res.json(workload);
    } catch (err) {
        console.error('Error fetching employee workload:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
