async function test() {
    try {
        console.log("Fetching orders from http://localhost:5000/api/orders");
        const res = await fetch('http://localhost:5000/api/orders');
        console.log("Status:", res.status, res.statusText);

        const contentType = res.headers.get("content-type");
        console.log("Content-Type:", contentType);

        if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            console.log("Response Data:", JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log("Response Text:", text);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
test();
