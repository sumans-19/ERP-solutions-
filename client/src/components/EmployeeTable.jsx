import React from 'react';

const EmployeeTable = ({ employees, onRowClick }) => {
    if (!employees || employees.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200 shadow-sm">
                <p className="text-slate-500">No employees found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">ID</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Orders</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Items</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Assigned</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.map((emp) => (
                            <tr
                                key={emp._id}
                                onClick={() => onRowClick(emp)}
                                className="hover:bg-blue-50 cursor-pointer transition border-b border-slate-100 group"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {emp.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="font-medium text-slate-900">{emp.fullName}</div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-600 hidden sm:table-cell">{emp.employeeId}</td>
                                <td className="p-4 text-sm text-slate-600 hidden md:table-cell">{emp.email}</td>
                                <td className="p-4 text-sm text-slate-900 text-center font-medium">{emp.assignedOrdersCount || 0}</td>
                                <td className="p-4 text-sm text-slate-900 text-center font-medium">{emp.assignedItemsCount || 0}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.calculatedStatus === 'Assigned'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {emp.calculatedStatus || 'Available'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500 hidden lg:table-cell">
                                    {emp.lastAssignedDate ? new Date(emp.lastAssignedDate).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeTable;
