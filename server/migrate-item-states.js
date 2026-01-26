require('dotenv').config();
const mongoose = require('mongoose');

const migrateItemStates = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in .env file');
        }

        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Use direct MongoDB update to bypass Mongoose middleware
        const db = mongoose.connection.db;
        const itemsCollection = db.collection('items');

        // Find all items without a state field
        console.log('🔍 Finding items without state...');
        const itemsToUpdate = await itemsCollection.find({
            $or: [
                { state: { $exists: false } },
                { state: null },
                { state: '' }
            ]
        }).toArray();

        console.log(`📊 Found ${itemsToUpdate.length} items without state`);

        if (itemsToUpdate.length === 0) {
            console.log('✅ All items already have a state!');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Update all items to have "New" state
        console.log('🔄 Updating items to "New" state...');

        const result = await itemsCollection.updateMany(
            {
                $or: [
                    { state: { $exists: false } },
                    { state: null },
                    { state: '' }
                ]
            },
            {
                $set: {
                    state: 'New',
                    assignedEmployees: [],
                    holdReason: '',
                    stateHistory: [{
                        state: 'New',
                        changedAt: new Date(),
                        changedBy: 'migration-script',
                        reason: 'Initial state migration'
                    }]
                }
            }
        );

        console.log(`✅ Successfully updated ${result.modifiedCount} items to "New" state!`);

        // Verify the update
        const newStateCount = await itemsCollection.countDocuments({ state: 'New' });
        const totalItems = await itemsCollection.countDocuments();

        console.log('\n📊 Final Statistics:');
        console.log(`   Total Items: ${totalItems}`);
        console.log(`   Items in "New" state: ${newStateCount}`);
        console.log(`   Items in other states: ${totalItems - newStateCount}`);

        // Show some sample items
        const sampleItems = await itemsCollection.find({ state: 'New' }).limit(5).toArray();
        console.log('\n📋 Sample items in "New" state:');
        sampleItems.forEach(item => {
            console.log(`   - ${item.name} (Code: ${item.code || 'N/A'})`);
        });

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        console.log('✅ Migration completed successfully!');
        console.log('\n🎯 Next step: Refresh your browser and check Process Management!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

// Run migration
migrateItemStates();
