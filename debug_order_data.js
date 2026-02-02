
const mongoose = require('mongoose');
const Order = require('./server/models/Order');
const Item = require('./server/models/Item');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/oms-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to DB');
    checkRecentOrder();
}).catch(err => console.error(err));

async function checkRecentOrder() {
    try {
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (!order) {
            console.log('No orders found.');
            return;
        }
        console.log(`\n=== Recent Order: ${order.poNumber} ===`);
        console.log(`Order ID: ${order._id}`);
        console.log(`Status: ${order.status}, Stage: ${order.orderStage}`);

        if (order.items && order.items.length > 0) {
            order.items.forEach((item, idx) => {
                console.log(`\nItem #${idx + 1}: ${item.itemName} (Qty: ${item.quantity})`);
                console.log(`RM Requirements stored in Order:`);
                if (item.rmRequirements && item.rmRequirements.length > 0) {
                    item.rmRequirements.forEach(rm => {
                        console.log(` - Code: "${rm.itemCode}", Name: "${rm.name}", Required Qty: ${rm.required}, UOM: ${rm.uom}`);
                    });
                } else {
                    console.log(' - No RM Requirements found in this Order Item.');
                }
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}
