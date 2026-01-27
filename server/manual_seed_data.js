require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Party = require('./models/Party');
const Employee = require('./models/Employee');

const seedData = async () => {
    try {
        console.log('--- SEEDING START ---');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Database');

        // 1. Seed Employees
        const employees = [
            {
                employeeId: 'EMP-A101',
                fullName: 'Alice Johnson',
                email: 'alice.johnson@elints.com',
                phone: '+91 9988776655',
                password: 'password123',
                role: 'Supervisor',
                status: 'Active',
                calculatedStatus: 'Available'
            },
            {
                employeeId: 'EMP-B202',
                fullName: 'Bob Smith',
                email: 'bob.smith@elints.com',
                phone: '+91 8877665544',
                password: 'password123',
                role: 'Worker',
                status: 'Active',
                calculatedStatus: 'Available'
            }
        ];

        for (const emp of employees) {
            await Employee.findOneAndUpdate({ email: emp.email }, emp, { upsert: true, new: true });
        }
        console.log('✅ Employees seeded');

        // 2. Seed Parties
        const parties = [
            {
                name: 'TechSource Solutions',
                gstin: '29AAAAA0000A1Z5',
                phone: '080-2345678',
                billingAddress: '123 Electronic City, Phase 1',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560100',
                openingBalance: 0,
                balanceType: 'toReceive',
                creditLimitType: 'noLimit',
                status: 'Active'
            },
            {
                name: 'Global Manufacturing Corp',
                gstin: '27BBBBB1111B1Z2',
                phone: '022-8765432',
                billingAddress: '456 Industrial Estate, Andheri East',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400069',
                openingBalance: 5000,
                balanceType: 'toReceive',
                creditLimitType: 'custom',
                customCreditLimit: 50000,
                status: 'Active'
            }
        ];

        for (const party of parties) {
            await Party.findOneAndUpdate({ name: party.name }, party, { upsert: true, new: true });
        }
        console.log('✅ Parties seeded');

        // 3. Seed Items (3 Items, 6 Steps each)
        const itemNames = ['Control Panel Assembly', 'Industrial Sensor Hub', 'Power Distribution Unit'];
        const itemCodes = ['CPA-001', 'ISH-202', 'PDU-303'];

        for (let i = 0; i < 3; i++) {
            const newItem = {
                name: itemNames[i],
                code: itemCodes[i],
                type: 'product',
                category: 'Electronics',
                unit: 'PCS',
                hsn: '8537',
                salePrice: '15000',
                purchasePrice: '8000',
                taxRate: '18%',
                openingQty: '10',
                currentStock: 10,
                minStock: '2',
                location: 'Warehouse A',
                state: 'New',
                processes: [
                    { id: 1, stepName: 'Component Preparation', description: 'Gathering components', stepType: 'execution', status: 'pending' },
                    { id: 2, stepName: 'PCB Soldering', description: 'Mounting components on board', stepType: 'execution', status: 'pending' },
                    { id: 3, stepName: 'Wiring & Harnessing', description: 'Internal wiring', stepType: 'execution', status: 'pending' },
                    { id: 4, stepName: 'Enclosure Assembly', description: 'Fitting into housing', stepType: 'execution', status: 'pending' },
                    { id: 5, stepName: 'Functional Testing', description: 'Testing operations', stepType: 'testing', status: 'pending' },
                    { id: 6, stepName: 'Final QA & Packing', description: 'Quality check and packing', stepType: 'testing', status: 'pending' }
                ],
                assignedEmployees: []
            };

            await Item.findOneAndUpdate({ code: newItem.code }, newItem, { upsert: true, new: true });
        }
        console.log('✅ Items seeded (6 steps each)');

        console.log('--- SEEDING COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
