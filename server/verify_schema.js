async function verify() {
    try {
        const res = await fetch('http://localhost:5000/api/employees');
        const data = await res.json();

        if (data.length > 0) {
            const emp = data[0];
            console.log('Sample Employee:', emp.fullName);
            if (!emp.role && !emp.department) {
                console.log('✅ SUCCESS: Role and Department are MISSING from response.');
            } else {
                console.log('❌ FAILURE: Role or Department still present.');
                console.log('Role:', emp.role);
                console.log('Dept:', emp.department);
            }
        } else {
            console.log('❌ No data found');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
verify();
