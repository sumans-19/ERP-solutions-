const mongoose = require('mongoose');
const JobCard = require('./models/JobCard');
require('dotenv').config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find jobs that have any assigned employees
        const jobs = await JobCard.find({
            'steps.assignedEmployees.0': { $exists: true }
        }).limit(5).lean();

        console.log(`Found ${jobs.length} jobs with assignments.`);

        jobs.forEach((job, i) => {
            console.log(`\nJob ${i + 1}: ${job.jobNumber}`);
            job.steps.forEach((step, si) => {
                if (step.assignedEmployees && step.assignedEmployees.length > 0) {
                    console.log(`  Step ${si + 1}: ${step.stepName}`);
                    console.log('    assignedEmployees:', JSON.stringify(step.assignedEmployees, null, 2));

                    // Check types explicitly
                    step.assignedEmployees.forEach((ae, ai) => {
                        console.log(`      [${ai}] employeeId Type:`, typeof ae.employeeId);
                        if (ae.employeeId && typeof ae.employeeId === 'object') {
                            console.log(`      [${ai}] employeeId Constructor:`, ae.employeeId.constructor.name);
                        }
                    });
                }
            });
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
