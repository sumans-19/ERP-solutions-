const axios = require('axios');

async function verify() {
    try {
        console.log('Testing Documentation Stock API...');
        const res = await axios.get('http://localhost:5001/api/documentation/items-with-stock', {
            headers: { 'x-user-role': 'admin' }
        });
        console.log('--- SUCCESS ---');
        console.log('Count:', res.data.length);
        if (res.data.length > 0) {
            console.log('First Item:', res.data[0].name, 'Stock:', res.data[0].currentStock);
        }

        console.log('\nTesting Finished Goods API...');
        const fgRes = await axios.get('http://localhost:5001/api/finished-goods', {
            headers: { 'x-user-role': 'admin' }
        });
        console.log('--- SUCCESS ---');
        console.log('FG Count:', fgRes.data.length);

        process.exit(0);
    } catch (err) {
        console.error('VERIFICATION FAILED:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
        process.exit(1);
    }
}

verify();
