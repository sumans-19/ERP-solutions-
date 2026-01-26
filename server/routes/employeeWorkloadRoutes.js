const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Employee = require('../models/Employee');

// GET /api/employees/workload - Get employee workload from items
router.get('/workload', async (req, res) => {
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
            workloadMap[emp._id.toString()] = {
                _id: emp._id,
                employeeName: emp.fullName,
                role: emp.role || emp.employeeId,
                totalAssignments: 0,
                pendingCount: 0,
                processingCount: 0,
                doneCount: 0
            };
        });

        // Aggregate tasks from items
        let totalTasksFound = 0;
        items.forEach(item => {
            if (item.manufacturingProcess && Array.isArray(item.manufacturingProcess)) {
                item.manufacturingProcess.forEach(step => {
                    if (step.assignedEmployeeId) {
                        const empId = step.assignedEmployeeId.toString();
                        if (workloadMap[empId]) {
                            workloadMap[empId].totalAssignments++;
                            totalTasksFound++;

                            // Count by status
                            const status = (step.status || '').toLowerCase();
                            if (status === 'pending' || status === 'assigned' || status === '') {
                                workloadMap[empId].pendingCount++;
                            } else if (status === 'in-progress' || status === 'processing') {
                                workloadMap[empId].processingCount++;
                            } else if (status === 'completed' || status === 'done') {
                                workloadMap[empId].doneCount++;
                            }
                        }
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
