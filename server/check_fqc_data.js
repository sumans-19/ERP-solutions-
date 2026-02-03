const mongoose = require('mongoose');
const JobCard = require('./models/JobCard');
const Item = require('./models/Item');

mongoose.connect("mongodb+srv://karanm:karan12mongo@cluster0.dwkjhis.mongodb.net/?appName=Cluster0")
    .then(() => {
        console.log('Connected to DB');
        checkFQCData();
    }).catch(err => console.error(err));

async function checkFQCData() {
    try {
        // Get a recent job
        const job = await JobCard.findOne()
            .populate('itemId')
            .sort({ createdAt: -1 });

        if (!job) {
            console.log('No jobs found');
            return;
        }

        console.log('\n=== JOB CARD DATA ===');
        console.log(`Job Number: ${job.jobNumber}`);
        console.log(`Item: ${job.itemId?.name || 'N/A'}`);

        console.log('\n=== FQC DATA FROM ITEM ===');
        if (job.itemId?.finalQualityCheck) {
            console.log(`Total FQC Parameters: ${job.itemId.finalQualityCheck.length}`);
            job.itemId.finalQualityCheck.forEach((param, i) => {
                console.log(`\nParameter ${i + 1}:`);
                console.log(`  Name: ${param.parameter}`);
                console.log(`  Notation: ${param.notation}`);
                console.log(`  Positive Tolerance: ${param.positiveTolerance || 'NOT SET'}`);
                console.log(`  Negative Tolerance: ${param.negativeTolerance || 'NOT SET'}`);
                console.log(`  Actual Value: ${param.actualValue || 'NOT SET'}`);
                console.log(`  Standard Value: ${param.standardValue || 'NOT SET'}`);
            });
        } else {
            console.log('NO FQC DATA');
        }

        console.log('\n=== FQC IMAGES ===');
        if (job.itemId?.finalQualityCheckImages) {
            console.log(`Total Images: ${job.itemId.finalQualityCheckImages.length}`);
            job.itemId.finalQualityCheckImages.forEach((img, i) => {
                console.log(`  Image ${i + 1}: ${img}`);
            });
        } else {
            console.log('NO IMAGES');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}
