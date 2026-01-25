const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Party = require('./models/Party');

dotenv.config();

const partiesData = [
    { name: 'Acme Corp', phone: '555-0123', currentBalance: 5000, location: 'New York' },
    { name: 'Globex Inc', phone: '555-0987', currentBalance: 2500, location: 'London' },
    { name: 'Soylent Corp', phone: '555-1111', currentBalance: 0, location: 'Tokyo' },
    { name: 'Initech', phone: '555-2222', currentBalance: 15000, location: 'Austin' },
];

const seedParties = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await Party.deleteMany({}); // Clear old

        for (const p of partiesData) {
            await Party.create(p);
        }

        console.log(`✅ Seeded ${partiesData.length} parties.`);
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seedParties();
