require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function fixQuantities() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');

        const orders = await Order.find({});
        console.log(`🔍 Found ${orders.length} orders to check`);

        for (const order of orders) {
            let needsUpdate = false;

            order.items.forEach(item => {
                const actualPlanned = (item.jobBatches || []).reduce((sum, b) => sum + (b.batchQty || 0), 0);
                if (item.plannedQty !== actualPlanned) {
                    console.log(`[Order: ${order.poNumber || order._id}] Item: ${item.itemName} | plannedQty: ${item.plannedQty} -> ${actualPlanned}`);
                    item.plannedQty = actualPlanned;
                    needsUpdate = true;
                }
            });

            // Sync orderStage if it's new but status is Processing
            if (order.status === 'Processing' && order.orderStage === 'New') {
                console.log(`[Order: ${order.poNumber || order._id}] Syncing stage from New to Processing`);
                order.orderStage = 'Processing';
                needsUpdate = true;
            }

            if (needsUpdate) {
                await order.save();
                console.log(`✅ Updated Order: ${order.poNumber || order._id}`);
            }
        }

        console.log('✨ Data synchronization complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during fix:', err);
        process.exit(1);
    }
}

fixQuantities();
