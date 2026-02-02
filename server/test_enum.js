require('dotenv').config();
const mongoose = require('mongoose');
const InventoryLog = require('./models/InventoryLog');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Testing InventoryLog validation...");
        const log = new InventoryLog({
            itemCode: 'TEST',
            changeType: 'GRN Edit (Reverse)',
            newQty: 10,
            changeQty: 10
        });
        await log.validate();
        console.log("✅ Validation passed!");
    } catch (err) {
        console.error("❌ Validation failed:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

test();
