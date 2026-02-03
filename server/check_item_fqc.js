// Script to check FQC data on an Item and optionally add a test image
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./models/Item');

async function checkItemFQCData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB\n');

        // Find item matching "Panel Sticker" or "SET2r"
        const item = await Item.findOne({
            $or: [
                { name: { $regex: /panel sticker/i } },
                { name: { $regex: /SET2r/i } },
                { name: { $regex: /BP2/i } }
            ]
        });

        if (!item) {
            console.log('No matching item found');
            process.exit(0);
        }

        console.log('=== ITEM DATA ===');
        console.log('Item ID:', item._id);
        console.log('Item Name:', item.name);
        console.log('Item Code:', item.code);

        console.log('\n=== FQC PARAMETERS ===');
        console.log('Total FQC Checks:', item.finalQualityCheck?.length || 0);
        if (item.finalQualityCheck && item.finalQualityCheck.length > 0) {
            item.finalQualityCheck.forEach((fqc, i) => {
                console.log(`  [${i + 1}] Parameter: ${fqc.parameter}`);
                console.log(`      Notation: ${fqc.notation}`);
                console.log(`      Pos Tolerance: ${fqc.positiveTolerance || 'N/A'}`);
                console.log(`      Neg Tolerance: ${fqc.negativeTolerance || 'N/A'}`);
                console.log(`      Expected Value: ${fqc.actualValue || 'N/A'}`);
            });
        }

        console.log('\n=== FQC IMAGES ===');
        console.log('Total Images:', item.finalQualityCheckImages?.length || 0);
        if (item.finalQualityCheckImages && item.finalQualityCheckImages.length > 0) {
            item.finalQualityCheckImages.forEach((img, i) => {
                // Show first 100 chars to identify the type
                console.log(`  [${i + 1}] ${img.substring(0, 100)}...`);
            });
        } else {
            console.log('  ⚠️  NO IMAGES STORED - Need to upload images in Item form');
        }

        console.log('\n=== FQC SAMPLE SIZE ===');
        console.log('Sample Size:', item.finalQualityCheckSampleSize || 'Not set');

        // Ask if user wants to add a test image
        const args = process.argv.slice(2);
        if (args.includes('--add-test-image')) {
            console.log('\n=== ADDING TEST IMAGE ===');
            // Add a simple placeholder base64 image (1x1 red pixel PNG)
            const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

            if (!item.finalQualityCheckImages) {
                item.finalQualityCheckImages = [];
            }
            item.finalQualityCheckImages.push(testImage);
            await item.save();
            console.log('✅ Test image added successfully!');
            console.log('Total Images Now:', item.finalQualityCheckImages.length);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkItemFQCData();
