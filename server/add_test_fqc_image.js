// Add a test FQC image to an Item
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./models/Item');

async function addTestImage() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find the Panel Sticker item
        const item = await Item.findOne({ name: { $regex: /panel/i } });

        if (!item) {
            console.log('Item not found');
            process.exit(1);
        }

        console.log('Found Item:', item.name);
        console.log('Current Images:', item.finalQualityCheckImages?.length || 0);

        // Sample test image - a small red square (base64 PNG)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABN0lEQVRogeXZMQ6CQBCF4T9RI+EQnIDCWNlZGGNrb+cBuImFB7CxofEAnkBjYWVhQmIhCQewsCbGDhYWxEKzu6xkkPclfDNhZjJDAIREImXuBLKS0YdVALYNMn5g1UWxCFBU3oAO0A08AvfA3LI/I+TI5p0xsKu9CcsAgB6wApayX8O/gRdgLl1Tw2KLJqz6AKpIxZYFkLEsj4FD7U1YLQDLgBWwZFkOoC3dUsOybgC2AasxYAksW5bD62XZApjW3oRlPQCWSMWWLYANy/IY2NPehGU9AJZI1ZYt0GLLMrC62puwHABLlmXLcjjY0t6E5QLYB6xWgC3L8hjYspqwHAAbluUB0JZuqWFZNwBb1mNg17I8+HpZtgCmtTdh2Q+AJVKxZQtg07IcDra0N2HZAphWewdY1gMoezSs8gAAAABJRU5ErkJggg==';

        // Initialize array if not exists
        if (!item.finalQualityCheckImages) {
            item.finalQualityCheckImages = [];
        }

        // Add test image
        item.finalQualityCheckImages.push(testImage);
        await item.save();

        console.log('Test image added!');
        console.log('New Images count:', item.finalQualityCheckImages.length);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

addTestImage();
