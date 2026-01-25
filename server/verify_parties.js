async function verify() {
    try {
        console.log("Checking Parties...");
        const res = await fetch('http://localhost:5000/api/parties');
        const parties = await res.json();
        console.log(`✅ Parties Count: ${parties.length}`);

        if (parties.length > 0) {
            const pid = parties[0]._id;
            console.log(`Checking Follow Ups for ${parties[0].name}...`);
            const res2 = await fetch(`http://localhost:5000/api/parties/follow-ups?partyId=${pid}`);
            const fu = await res2.json();
            console.log(`✅ Follow Ups: ${fu.length}`);
        }

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}
verify();
