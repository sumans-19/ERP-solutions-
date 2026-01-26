const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Item = require('./models/Item');

async function checkDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const totalItems = await Item.countDocuments();
        console.log('Total Items:', totalItems);

        if (totalItems > 0) {
            const samples = await Item.find().limit(5);
            samples.forEach(item => {
                console.log(`Item: ${item.name} | State: ${item.state} | History: ${item.stateHistory.length} entries`);
                if (item.stateHistory.length > 0) {
                    console.log('Last change:', item.stateHistory[item.stateHistory.length - 1]);
                }
            });
        }

        const stateCounts = await Item.aggregate([
            { $group: { _id: '$state', count: { $sum: 1 } } }
        ]);
        console.log('State Distribution:', stateCounts);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDb();
