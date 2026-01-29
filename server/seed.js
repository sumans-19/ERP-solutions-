require('dotenv').config();
const mongoose = require('mongoose');
const { seedUsers, seedPermissions } = require('./utils/seed');

async function runSeed() {
    try {
        console.log('🌱 Starting database seed...');
        await mongoose.connect(process.env.MONGO_URI);
        await seedUsers();
        await seedPermissions();
        console.log('✅ Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

runSeed();
