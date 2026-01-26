const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Item = require('./models/Item');

async function checkHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const items = await Item.find({ stateHistory: { $exists: true, $not: { $size: 0 } } }).limit(1);

        if (items.length > 0) {
            console.log(`FOUND ITEM WITH HISTORY: ${items[0].name}`);
            console.log('HISTORY ENTRIES:', items[0].stateHistory.length);
            console.log('FIRST 2 ENTRIES:', JSON.stringify(items[0].stateHistory.slice(0, 2), null, 2));
        } else {
            console.log('NO ITEMS FOUND WITH STATE HISTORY! Graph will be empty.');
            const anyItem = await Item.findOne();
            if (anyItem) {
                console.log(`Sample item ${anyItem.name} has ${anyItem.stateHistory.length} history entries.`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkHistory();
