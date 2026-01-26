const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/elints-oms';

async function checkDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📦 Available collections:');
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Check each collection for data
        console.log('\n📊 Collection data counts:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`   - ${col.name}: ${count} documents`);

            // If it looks like it might contain assignments, show a sample
            if (col.name.toLowerCase().includes('assign') || col.name.toLowerCase().includes('step')) {
                const sample = await db.collection(col.name).findOne();
                if (sample) {
                    console.log(`\n   Sample document from ${col.name}:`);
                    console.log(JSON.stringify(sample, null, 2));
                }
            }
        }

        // Also check for items with production steps
        const items = await db.collection('items').find({}).toArray();
        console.log(`\n🔍 Checking ${items.length} items for production steps...`);
        for (const item of items) {
            if (item.productionSteps && item.productionSteps.length > 0) {
                console.log(`\n   Item: ${item.itemName || item.name}`);
                console.log(`   Production steps: ${item.productionSteps.length}`);
                item.productionSteps.forEach((step, idx) => {
                    console.log(`      ${idx + 1}. ${step.stepName || step.name} - Assigned to: ${step.assignedTo || step.employeeName || 'Not assigned'} - Status: ${step.status}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkDatabase();
