const mongoose = require('mongoose');
const RawMaterial = require('./models/RawMaterial');
require('dotenv').config();

async function testUpdate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Testing update for code "12345"');

    const rm = await RawMaterial.findOne({ code: "12345" });
    if (rm) {
        console.log(`Found RM: ${rm.name}, Qty: ${rm.qty}`);
        rm.qty += 10;
        await rm.save();
        console.log('Updated Qty + 10');
        const updated = await RawMaterial.findOne({ code: "12345" });
        console.log(`New Qty: ${updated.qty}`);
    } else {
        console.log('RM 12345 not found');
    }

    await mongoose.disconnect();
}
testUpdate();
