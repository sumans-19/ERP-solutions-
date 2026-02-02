const mongoose = require('mongoose');
const JobCard = require('./models/JobCard');
const Employee = require('./models/Employee');
require('dotenv').config();

const TARGET_ID_STR = '697a143d8b6f59843e69b650';

async function deepInspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Verify Employee Data
        const employee = await Employee.findById(TARGET_ID_STR).lean();
        console.log(`\n1. Checking Employee [${TARGET_ID_STR}]`);
        if (!employee) {
            console.log('   ❌ Employee NOT FOUND in DB');
        } else {
            console.log(`   ✅ Found: ${employee.fullName} (${employee.employeeId})`);
            console.log(`   ASSIGNMENTS in Employee Record: ${employee.currentAssignments?.length || 0}`);
            if (employee.currentAssignments?.length) {
                console.log('   Sample Assignment 0:', JSON.stringify(employee.currentAssignments[0]));
            }
        }

        // 2. Check JobCards with String Query
        console.log(`\n2. Querying JobCards (String Match)`);
        const jobsString = await JobCard.find({
            'steps.assignedEmployees.employeeId': TARGET_ID_STR
        }).countDocuments();
        console.log(`   Found ${jobsString} jobs using STRING ID.`);

        // 3. Check JobCards with ObjectId Query
        console.log(`\n3. Querying JobCards (ObjectId Match)`);
        const jobsObject = await JobCard.find({
            'steps.assignedEmployees.employeeId': new mongoose.Types.ObjectId(TARGET_ID_STR)
        }).lean();
        console.log(`   Found ${jobsObject.length} jobs using OBJECTID.`);

        // 4. Dump one if found
        if (jobsObject.length > 0) {
            const j = jobsObject[0];
            const s = j.steps.find(step => step.assignedEmployees.some(ae => ae.employeeId.toString() === TARGET_ID_STR));
            console.log(`   Sample Job: ${j.jobNumber}`);
            console.log(`   Sample Step: ${s?.stepName}`);
            console.log(`   Assignments:`, JSON.stringify(s?.assignedEmployees));
        } else {
            // 5. Broad Search if nothing found
            console.log(`\n4. Broad Search (Checking ALL jobs for any trace)`);
            const allJobs = await JobCard.find({}).lean();
            let foundCount = 0;
            allJobs.forEach(j => {
                j.steps.forEach(s => {
                    if (s.assignedEmployees) {
                        s.assignedEmployees.forEach(ae => {
                            if (String(ae.employeeId) === TARGET_ID_STR) {
                                console.log(`   FOUND MATCH in Job ${j.jobNumber} Step ${s.stepName}`);
                                console.log(`   Value in DB:`, ae.employeeId);
                                console.log(`   Type:`, typeof ae.employeeId);
                                foundCount++;
                            }
                        });
                    }
                });
            });
            console.log(`   Total Manual Matches Found: ${foundCount}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

deepInspect();
