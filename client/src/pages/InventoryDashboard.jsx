import React, { useEffect } from 'react';

const InventoryDashboard = ({ setActiveSection }) => {
    useEffect(() => {
        // Redirect to the full inventory page
        if (setActiveSection) {
            setActiveSection('admin-inventory');
        }
    }, [setActiveSection]);

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
                    <p className="text-slate-600">Redirecting to inventory...</p>
                </div>
            </div>
        </main>
    );
};

export default InventoryDashboard;

