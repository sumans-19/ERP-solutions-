const mongoose = require('mongoose');
require('dotenv').config();
const Item = require('./models/Item');

async function checkItems() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const count = await Item.countDocuments();
        console.log('Total Items:', count);

        const items = await Item.find().limit(10).lean();
        items.forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.name}`);
            console.log('  - image size:', item.image ? item.image.length : 0);
            console.log('  - images count:', item.images ? item.images.length : 0);
            let imagesTotalSize = 0;
            if (item.images) item.images.forEach(img => imagesTotalSize += img.length);
            console.log('  - images total size:', imagesTotalSize);

            let fqcImagesTotalSize = 0;
            if (item.finalQualityCheckImages) item.finalQualityCheckImages.forEach(img => fqcImagesTotalSize += img.length);
            console.log('  - fqcImages total size:', fqcImagesTotalSize);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkItems();
