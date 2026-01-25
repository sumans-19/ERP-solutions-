async function verifyStatus() {
    try {
        const res = await fetch('http://localhost:5000/api/employees');
        const employees = await res.json();

        console.log("--- Employee Status Check ---");
        employees.forEach(emp => {
            console.log(`${emp.fullName} (${emp.employeeId}): ${emp.calculatedStatus} [Orders: ${emp.assignedOrdersCount}]`);
        });

        const sarah = employees.find(e => e.employeeId === 'EMP001');
        if (sarah && sarah.calculatedStatus === 'Busy') {
            console.log("\n✅ SUCCESS: Sarah is marked Busy.");
        } else {
            console.log("\n❌ FAILURE: Sarah should be Busy.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}
verifyStatus();
