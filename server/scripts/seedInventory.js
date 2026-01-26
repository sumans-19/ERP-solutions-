require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const seedInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Clear existing
        await Inventory.deleteMany({});
        console.log('🗑️ Cleared inventory');

        const today = new Date();
        const addMonths = (date, months) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + months);
            return d;
        };

        const seedData = [
            {
                name: 'Carbon Sheet',
                qty: 250,
                unit: 'meters',
                expiry: addMonths(today, 6)
            },
            {
                name: 'Vinyl Roll',
                qty: 120,
                unit: 'meters',
                expiry: addMonths(today, 3)
            },
            {
                name: 'Black Paint',
                qty: 40,
                unit: 'cans',
                expiry: addMonths(today, 12)
            },
            {
                name: 'Aluminium Rod',
                qty: 75,
                unit: 'kg',
                expiry: addMonths(today, 9)
            },
            {
                name: 'Acrylic Sheet',
                qty: 60,
                unit: 'sheets',
                expiry: addMonths(today, 4)
            }
        ];

        const filled = await Inventory.insertMany(seedData);
        console.log(`✅ Seeded ${filled.length} items`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedInventory();
