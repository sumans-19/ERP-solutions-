const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const JobCard = require('../models/JobCard'); // Added for new tracking
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const authenticateToken = require('../middleware/auth');

// GET /api/employees/workload - Get employee workload from items
router.get('/workload', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Fetching employee workload from items...');

        // Get all employees
        const employees = await Employee.find({}).lean();
        console.log(`Found ${employees.length} employees`);

        // Get all JobCards (The new Single Source of Truth for production)
        const jobCards = await JobCard.find({})
            .populate('itemId', 'name code') // Populate item details
            .lean();
        console.log(`Found ${jobCards.length} job cards`);

        // Get all administrative tasks
        const adminTasks = await Task.find({}).lean();

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
                adminTaskCount: 0,
                tasks: [] // Store detailed tasks
            };
        });

        // 1. Aggregate tasks from JobCards
        let totalTasksFound = 0;
        jobCards.forEach(job => {
            if (job.steps && Array.isArray(job.steps)) {
                job.steps.forEach(step => {
                    const rawId = step.employeeId;
                    const empId = rawId ? rawId.toString().trim() : null;

                    // console.log(`Job ${job.jobNumber} Step ${step.stepName} Emp: ${empId}`); // verbose

                    if (empId && workloadMap[empId]) {
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

                        // Add to tasks list
                        workloadMap[empId].tasks.push({
                            type: 'Production',
                            jobId: job._id,
                            jobNumber: job.jobNumber,
                            itemId: job.itemId?._id,
                            itemName: job.itemId?.name || 'Unknown Item',
                            itemCode: job.itemId?.code || job.jobNumber,
                            stepId: step.stepId,
                            stepName: step.stepName || 'Unknown Step',
                            status: step.status,
                            assignedAt: step.assignedAt || job.createdAt,
                            completedAt: step.endTime
                        });
                    }
                });
            }
        });

        // Aggregate administrative tasks
        adminTasks.forEach(task => {
            const empId = task.employeeId ? task.employeeId.toString().trim() : null;
            if (empId && workloadMap[empId]) {
                workloadMap[empId].adminTaskCount++;
                workloadMap[empId].totalAssignments++;

                workloadMap[empId].tasks.push({
                    taskId: task._id,
                    title: task.title,
                    type: 'Administrative',
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    assignedAt: task.createdAt
                });
            }
        });

        console.log(`Total manufacturing tasks: ${totalTasksFound}, Total admin tasks: ${adminTasks.length}`);

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
