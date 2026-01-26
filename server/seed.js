require('dotenv').config();
const mongoose = require('mongoose');
const Party = require('./models/Party');
const Employee = require('./models/Employee');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB using .env
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in .env file');
        }

        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas successfully!');

        // Clear existing seed data
        console.log('🗑️  Clearing existing seed data...');
        await Party.deleteMany({ name: { $in: ['ABC Corporation', 'XYZ Industries Ltd'] } });
        await Employee.deleteMany({ employeeId: { $in: ['EMP001', 'EMP002'] } });
        console.log('✅ Cleared old seed data');

        // Seed Parties
        console.log('📝 Creating parties...');
        const parties = [
            {
                name: 'ABC Corporation',
                gstin: '27AABCU9603R1ZM',
                phone: '+91 9876543210',
                billingAddress: '123 Industrial Area, Sector 5',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                openingBalance: 50000,
                balanceType: 'toReceive',
                creditLimitType: 'custom',
                customCreditLimit: 100000,
                currentBalance: 50000,
                status: 'Active'
            },
            {
                name: 'XYZ Industries Ltd',
                gstin: '29AAACX1234E1Z5',
                phone: '+91 9988776655',
                billingAddress: '456 Tech Park, Phase 2',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
                openingBalance: 75000,
                balanceType: 'toReceive',
                creditLimitType: 'noLimit',
                currentBalance: 75000,
                initialOrder: {
                    orderNumber: 'PO-2024-001',
                    totalItems: 50,
                    ratePerItem: 1500,
                    description: 'Custom manufactured components for industrial machinery'
                },
                status: 'Active'
            }
        ];

        const createdParties = await Party.insertMany(parties);
        console.log(`✅ Created ${createdParties.length} parties`);

        // Seed Employees
        console.log('📝 Creating employees...');
        const employees = [
            {
                employeeId: 'EMP001',
                fullName: 'John Doe',
                email: 'john.doe@elints.com',
                phone: '+91 9123456789',
                password: 'worker123',
                role: 'Worker',
                status: 'Active',
                calculatedStatus: 'Available'
            },
            {
                employeeId: 'EMP002',
                fullName: 'Jane Smith',
                email: 'jane.smith@elints.com',
                phone: '+91 9234567890',
                password: 'qc123',
                role: 'QC Inspector',
                status: 'Active',
                calculatedStatus: 'Available'
            }
        ];

        const createdEmployees = await Employee.insertMany(employees);
        console.log(`✅ Created ${createdEmployees.length} employees`);

        // Verify the data
        const partyCount = await Party.countDocuments();
        const empCount = await Employee.countDocuments();

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Database Status:');
        console.log('-------------------');
        console.log(`Total Parties in DB: ${partyCount}`);
        console.log(`Total Employees in DB: ${empCount}`);
        console.log('\n📋 Seeded Data:');
        console.log('Parties:');
        createdParties.forEach(p => console.log(`  - ${p.name} (${p.city}) - ID: ${p._id}`));
        console.log('\nEmployees:');
        createdEmployees.forEach(e => console.log(`  - ${e.fullName} (${e.role}) - ID: ${e._id}`));
        console.log('\n✅ Refresh your browser to see the new data!');

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        console.error('Error details:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run seeding
seedDatabase();
