const mongoose = require('mongoose');
const JobCard = require('./models/JobCard');
const Employee = require('./models/Employee');
require('dotenv').config();

const PARAM_ID = '697a143d8b6f59843e69b650';

async function simulate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        let searchId = PARAM_ID;
        const isValidObjectId = mongoose.Types.ObjectId.isValid(PARAM_ID);

        let employeeDocs = [];
        if (isValidObjectId) {
            console.log('Param is valid ObjectId, looking up by _id...');
            employeeDocs = await Employee.find({ _id: PARAM_ID });
        }

        if (employeeDocs.length === 0) {
            console.log('Fallback: Looking up by employeeId string...');
            employeeDocs = await Employee.find({ employeeId: PARAM_ID });
        }

        if (employeeDocs.length > 0) {
            searchId = employeeDocs[0]._id;
            console.log(`Resolved searchId: ${searchId}`);
        } else {
            console.log('No employee found?');
        }

        const jobs = await JobCard.find({
            'steps.assignedEmployees.employeeId': searchId
        })
            .populate('steps.assignedEmployees.employeeId', 'name fullName email')
            .lean();

        console.log(`Query Result Count: ${jobs.length}`);

        if (jobs.length > 0) {
            const firstJob = jobs[0];
            const assignedStep = firstJob.steps.find(s => s.assignedEmployees.some(ae => ae.employeeId._id.toString() === searchId.toString()));

            console.log('First Job ID:', firstJob._id);
            console.log('Assigned Step:', assignedStep?.stepName);
            console.log('Assigned User (Populated):', JSON.stringify(assignedStep?.assignedEmployees[0]?.employeeId));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

simulate();
