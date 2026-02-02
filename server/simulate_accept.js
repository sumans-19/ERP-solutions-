const mongoose = require('mongoose');
const JobCard = require('./models/JobCard');
require('dotenv').config();

const JOB_ID = '697cdf75978825f876a589af';
const STEP_ID = '2'; // From user logs
const USER_ID = '697a143d8b6f59843e69b650';

async function simulateAccept() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const job = await JobCard.findById(JOB_ID);
        if (!job) {
            console.log('Job NOT FOUND');
            return;
        }
        console.log(`Job Found: ${job.jobNumber}`);

        const step = job.steps.find(s => s.stepId === STEP_ID);
        if (!step) {
            console.log(`Step ${STEP_ID} NOT FOUND`);
            console.log('Available Steps:', job.steps.map(s => s.stepId).join(', '));
            return;
        }

        console.log(`Step Status:`, step.status);
        console.log(`Is Open Job?`, step.isOpenJob);
        console.log(`Assignments:`, JSON.stringify(step.assignedEmployees));

        // Validation Checks from Route (Lines 64 & 69)
        if (!step.isOpenJob) {
            console.log('❌ FAIL: step.isOpenJob IS FALSE. This triggers 400.');
        } else {
            console.log('✅ Pass: step.isOpenJob is true.');
        }

        const isAssigned = step.assignedEmployees.some(a => a.employeeId && a.employeeId.toString() === USER_ID);
        if (isAssigned) {
            console.log('❌ FAIL: User already assigned. This triggers 400.');
        } else {
            console.log('✅ Pass: User not yet assigned.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

simulateAccept();
