const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/elints-oms';

async function migrateStepAssignments() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('stepassignments');

        // Get all documents
        const assignments = await collection.find({}).toArray();
        console.log(`Found ${assignments.length} step assignments to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const assignment of assignments) {
            const updates = {};
            let needsUpdate = false;

            // Map old field names to new field names
            if (assignment.assignedEmployeeId && !assignment.employeeId) {
                updates.employeeId = assignment.assignedEmployeeId;
                updates.$unset = { ...updates.$unset, assignedEmployeeId: '' };
                needsUpdate = true;
            }

            if (assignment.stepStatus && !assignment.status) {
                // Map old status values to new ones
                const statusMap = {
                    'Pending': 'assigned',
                    'Processing': 'in-progress',
                    'In Progress': 'in-progress',
                    'Done': 'completed',
                    'Completed': 'completed',
                    'Failed': 'failed'
                };
                updates.status = statusMap[assignment.stepStatus] || 'assigned';
                updates.$unset = { ...updates.$unset, stepStatus: '' };
                needsUpdate = true;
            }

            if (assignment.manufacturingStepNumber && !assignment.processStepId) {
                updates.processStepId = assignment.manufacturingStepNumber;
                updates.$unset = { ...updates.$unset, manufacturingStepNumber: '' };
                needsUpdate = true;
            }

            if (assignment.stepName && !assignment.processStepName) {
                updates.processStepName = assignment.stepName;
                updates.$unset = { ...updates.$unset, stepName: '' };
                needsUpdate = true;
            }

            if (needsUpdate) {
                const { $unset, ...setUpdates } = updates;
                const updateDoc = { $set: setUpdates };
                if ($unset) {
                    updateDoc.$unset = $unset;
                }

                await collection.updateOne(
                    { _id: assignment._id },
                    updateDoc
                );
                migratedCount++;
                console.log(`✅ Migrated assignment ${assignment._id}`);
            } else {
                skippedCount++;
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   - Migrated: ${migratedCount}`);
        console.log(`   - Skipped: ${skippedCount}`);
        console.log(`   - Total: ${assignments.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

migrateStepAssignments();
