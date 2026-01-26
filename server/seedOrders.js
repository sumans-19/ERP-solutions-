const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected for seeding orders"))
  .catch(err => console.log("❌ DB Connection Error:", err));

const dummyOrders = [
  {
    partyName: "Furniture Corp",
    poNumber: "PO-2026-001",
    poDate: new Date("2026-01-15"),
    estimatedDeliveryDate: new Date("2026-01-28"),
    items: [
      {
        itemName: "Steel Chair Frame",
        quantity: 50,
        unit: "pieces",
        rate: 450,
        amount: 22500,
        priority: "High"
      }
    ],
    status: "Processing",
    assignedTo: "EMP-12345",
    assignedDate: new Date("2026-01-20"),
    completionPercent: 65,
    notes: "High priority order - customer needs ASAP"
  },
  {
    partyName: "Office Solutions Ltd",
    poNumber: "PO-2026-002",
    poDate: new Date("2026-01-18"),
    estimatedDeliveryDate: new Date("2026-01-30"),
    items: [
      {
        itemName: "Office Desk",
        quantity: 25,
        unit: "pieces",
        rate: 1200,
        amount: 30000,
        priority: "Normal"
      }
    ],
    status: "New",
    assignedTo: "EMP-12345",
    assignedDate: new Date("2026-01-22"),
    completionPercent: 0,
    notes: "Standard delivery timeline"
  },
  {
    partyName: "Bright Lights Inc",
    poNumber: "PO-2026-003",
    poDate: new Date("2026-01-10"),
    estimatedDeliveryDate: new Date("2026-01-25"),
    items: [
      {
        itemName: "LED Light Fixture",
        quantity: 100,
        unit: "pieces",
        rate: 800,
        amount: 80000,
        priority: "Normal"
      }
    ],
    status: "Completed",
    assignedTo: "EMP-12345",
    assignedDate: new Date("2026-01-18"),
    completionPercent: 100,
    notes: "Completed ahead of schedule"
  },
  {
    partyName: "Home Decor Co",
    poNumber: "PO-2026-004",
    poDate: new Date("2026-01-20"),
    estimatedDeliveryDate: new Date("2026-02-01"),
    items: [
      {
        itemName: "Wooden Bookshelf",
        quantity: 15,
        unit: "pieces",
        rate: 4500,
        amount: 67500,
        priority: "High"
      }
    ],
    status: "Processing",
    assignedTo: "EMP-12345",
    assignedDate: new Date("2026-01-23"),
    completionPercent: 40,
    notes: "Custom finish required"
  },
  {
    partyName: "Construction Inc",
    poNumber: "PO-2026-005",
    poDate: new Date("2026-01-22"),
    estimatedDeliveryDate: new Date("2026-02-05"),
    items: [
      {
        itemName: "Aluminum Window Frame",
        quantity: 30,
        unit: "pieces",
        rate: 2500,
        amount: 75000,
        priority: "Normal"
      }
    ],
    status: "New",
    assignedTo: "EMP-12345",
    assignedDate: new Date("2026-01-25"),
    completionPercent: 0,
    notes: "Bulk order for new building project"
  }
];

async function seedOrders() {
  try {
    console.log('🌱 Starting to seed orders...');
    
    // Clear existing orders for this employee (optional)
    await Order.deleteMany({ assignedTo: "EMP-12345" });
    console.log('🗑️  Cleared existing orders for EMP-12345');
    
    // Insert dummy orders
    const result = await Order.insertMany(dummyOrders);
    console.log(`✅ Successfully added ${result.length} dummy orders`);
    
    // Display summary
    console.log('\n📦 Orders Summary:');
    result.forEach((order, index) => {
      console.log(`${index + 1}. ${order.poNumber} - ${order.partyName} - ${order.status} (${order.completionPercent}%)`);
    });
    
    console.log('\n✨ Order seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    process.exit(1);
  }
}

// Run the seed function
seedOrders();
