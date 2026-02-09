import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';

const EmployeeTasks = () => {
    const [employeeTasks, setEmployeeTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEmpId, setExpandedEmpId] = useState(null);

    useEffect(() => {
        fetchEmployeeTasks();
    }, []);

    const fetchEmployeeTasks = async () => {
        try {
            console.log('Fetching employee workload...');

            // Fetch both workload and all employees
            const [workloadRes, employeesRes] = await Promise.all([
                axios.get(`${API_URL}/api/employees/workload`),
                axios.get(`${API_URL}/api/employees`)
            ]);

            console.log('Workload response:', workloadRes.data);
            console.log('Employees response:', employeesRes.data);

            const workload = workloadRes.data || [];
            const allEmployees = employeesRes.data || [];

            // If no workload data, show all employees with 0 tasks
            if (workload.length === 0 && allEmployees.length > 0) {
                const employeesWithZeroTasks = allEmployees.map(emp => ({
                    _id: emp._id,
                    employeeName: emp.fullName || emp.name,
                    totalAssignments: 0,
                    pendingCount: 0,
                    processingCount: 0,
                    doneCount: 0,
                    tasks: [],
                    role: emp.role || emp.designation || emp.employeeId || 'Employee'
                }));
                console.log('No workload data, showing all employees with 0 tasks:', employeesWithZeroTasks);
                setEmployeeTasks(employeesWithZeroTasks);
            } else {
                // Enrich workload data with employee details
                const enrichedData = workload.map(task => {
                    const employee = allEmployees.find(emp => emp._id === task._id);
                    return {
                        ...task,
                        role: employee?.role || employee?.designation || employee?.employeeId || 'Employee'
                    };
                });
                console.log('Enriched workload data:', enrichedData);
                setEmployeeTasks(enrichedData);
            }
        } catch (error) {
            console.error('Failed to fetch employee tasks:', error);
            setEmployeeTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = employeeTasks.filter(emp =>
        emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUtilization = (emp) => {
        if (!emp.totalAssignments || emp.totalAssignments === 0) return 0;
        return Math.round(((emp.processingCount + emp.doneCount) / emp.totalAssignments) * 100);
    };

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Task Assignments</h1>
                    <p className="text-slate-600">Real-time employee workload and task distribution</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-md">
                        <Users className="text-slate-500" size={20} />
                        <span className="text-sm font-semibold text-slate-700">
                            {filteredTasks.length} Employee{filteredTasks.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Total Tasks
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Pending
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    In Progress
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Completed
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Utilization
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        Loading employee tasks...
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((emp) => (
                                    <React.Fragment key={emp._id}>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-700 font-bold text-sm">
                                                            {emp.employeeName?.charAt(0) || 'E'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{emp.employeeName || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{emp.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-900">{emp.totalAssignments || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                                    {emp.pendingCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                    {emp.processingCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                                    {emp.doneCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-blue-600 transition-all"
                                                            style={{ width: `${getUtilization(emp)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 w-12 text-right">
                                                        {getUtilization(emp)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setExpandedEmpId(expandedEmpId === emp._id ? null : emp._id)}
                                                    className={`p-2 rounded-md transition-colors ${expandedEmpId === emp._id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {expandedEmpId === emp._id ? 'Close' : 'View Tasks'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedEmpId === emp._id && (
                                            <tr key={`${emp._id}-details`} className="bg-slate-50">
                                                <td colSpan="7" className="px-8 py-6">
                                                    <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
                                                        <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-200">
                                                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Task Details</h3>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-50/30">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Item</th>
                                                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Step</th>
                                                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Status</th>
                                                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Assigned</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {emp.tasks && emp.tasks.length > 0 ? (
                                                                    emp.tasks.map((task, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                                            <td className="px-4 py-3">
                                                                                <p className="font-semibold text-slate-900">{task.itemName}</p>
                                                                                <p className="text-[10px] text-slate-500">{task.itemCode}</p>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-slate-700 font-medium">
                                                                                {task.stepName}
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                                        'bg-slate-100 text-slate-600'
                                                                                    }`}>
                                                                                    {task.status || 'Pending'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                                                {task.assignedAt ? new Date(task.assignedAt).toLocaleDateString() : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                                                                            No detailed tasks found for this employee
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary Cards */}
                {filteredTasks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white rounded-md p-4 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Total Assignments</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {filteredTasks.reduce((sum, emp) => sum + (emp.totalAssignments || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pending</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {filteredTasks.reduce((sum, emp) => sum + (emp.pendingCount || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {filteredTasks.reduce((sum, emp) => sum + (emp.processingCount || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-md p-4 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Completed</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {filteredTasks.reduce((sum, emp) => sum + (emp.doneCount || 0), 0)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main >
    );
};

export default EmployeeTasks;

