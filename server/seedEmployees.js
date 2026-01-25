const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const Order = require('./models/Order');
const Item = require('./models/Item');

dotenv.config();

const employeesData = [
    { employeeId: 'EMP001', fullName: 'Sarah Jenkins', email: 'sarah.j@elints.com', status: 'Active', dateJoined: '2023-01-15' },
    { employeeId: 'EMP002', fullName: 'Mike Chen', email: 'mike.c@elints.com', status: 'Active', dateJoined: '2023-03-10' },
    { employeeId: 'EMP003', fullName: 'Jessica Wu', email: 'jessica.w@elints.com', status: 'Active', dateJoined: '2023-02-01' },
    { employeeId: 'EMP004', fullName: 'David Miller', email: 'david.m@elints.com', status: 'Inactive', dateJoined: '2022-11-20' },
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Seed Employees
        await Employee.deleteMany({});
        const createdEmployees = [];
        for (const emp of employeesData) {
            const res = await Employee.findOneAndUpdate(
                { employeeId: emp.employeeId },
                { $set: emp },
                { upsert: true, new: true }
            );
            createdEmployees.push(res);
        }
        console.log(`✅ Seeded ${createdEmployees.length} employees`);

        // 2. Clear old workload (optional, to avoid duplicates on re-run)
        await Order.deleteMany({});
        await Item.deleteMany({});

        // 3. Seed Orders & Items
        const emp1 = createdEmployees[0]; // Sarah
        const emp2 = createdEmployees[1]; // Mike

        // Sarah: 2 Orders, 3 Items
        const order1 = await Order.create({
            orderId: 'ORD-101',
            description: 'Website Redesign',
            assignedTo: emp1._id, // Legacy field, keeping for consistency
            status: 'In Progress',
            processAssignments: [
                { processName: 'New', employeeId: emp1._id, assignedAt: new Date() },
                { processName: 'Verify', employeeId: emp2._id, assignedAt: new Date() }
            ]
        });
        const order2 = await Order.create({
            orderId: 'ORD-102',
            description: 'API Migration',
            assignedTo: emp1._id,
            status: 'Pending',
            processAssignments: [] // No assignments yet
        });

        await Item.create({ jobNo: 'JOB-A1', itemName: 'Homepage Mockup', orderId: order1._id, assignedTo: emp1._id });
        await Item.create({ jobNo: 'JOB-A2', itemName: 'Dashboard UI', orderId: order1._id, assignedTo: emp1._id });
        await Item.create({ jobNo: 'JOB-B1', itemName: 'User Auth API', orderId: order2._id, assignedTo: emp1._id });

        // Mike: 1 Order, 0 Items
        await Order.create({
            orderId: 'ORD-201',
            description: 'Q3 Roadmap',
            assignedTo: emp2._id,
            status: 'Completed',
            processAssignments: [
                { processName: 'New', employeeId: emp2._id },
                { processName: 'Verify', employeeId: emp2._id },
                { processName: 'Manufacturing', employeeId: emp2._id },
                { processName: 'Closure', employeeId: emp1._id }
            ]
        });

        console.log('✅ Seeded Orders and Items');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
