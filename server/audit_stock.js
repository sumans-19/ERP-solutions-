const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const logFile = 'audit_log_v3.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function audit() {
    try {
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

        await mongoose.connect(process.env.MONGO_URI);
        log('--- DATABASE AUDIT V3 (RAW FIELD CHECK) ---');

        const Item = require('./models/Item');
        const items = await Item.find({ currentStock: { $gt: 0 } }).lean();

        log(`\nITEMS WITH Stockholm GT 0: ${items.length}`);
        if (items.length > 0) {
            log(JSON.stringify(items[0], null, 2));
        }

        const FinishedGood = require('./models/FinishedGood');
        const fgs = await FinishedGood.find({ status: 'In Stock' }).lean();
        log(`\nFG IN STOCK: ${fgs.length}`);
        if (fgs.length > 0) {
            log(JSON.stringify(fgs[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        log('Audit failed: ' + err.message);
        process.exit(1);
    }
}

audit();
