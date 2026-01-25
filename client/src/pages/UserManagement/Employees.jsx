import React, { useState, useEffect, useMemo } from 'react';
import { getEmployees } from '../../services/employeeApi';
import PartiesComponent from '../../components/PartiesComponent';
import { getOrders, assignProcess } from '../../services/orderApi';
import {
    Users, Briefcase, CheckCircle, Clock, AlertTriangle,
    Layers, Search, ChevronRight, ChevronDown, UserPlus, Filter
} from 'lucide-react';

const PROCESS_STAGES = [
    'New', 'Verify', 'Manufacturing', 'QC Check', 'Documentation',
    'Dispatch Prep', 'Dispatch', 'Billing', 'Payment Follow-up', 'Closure'
];

const Employees = () => {
    // --- State ---
    const [employees, setEmployees] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [expandedOrderIds, setExpandedOrderIds] = useState({});

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [empData, ordData] = await Promise.all([getEmployees(), getOrders()]);
            setEmployees(empData);
            setOrders(ordData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Helpers ---
    const toggleOrderExpand = (orderId) => {
        setExpandedOrderIds(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const handleAssign = async (orderId, processName, employeeId) => {
        if (!employeeId) return;
        try {
            await assignProcess(orderId, processName, employeeId);
            // Optimistic update or refetch
            fetchData(); // Simplest to refetch to ensure consistency
        } catch (error) {
            console.error("Assignment failed", error);
            alert("Failed to assign process. Please try again.");
        }
    };

    // --- Derived Data ---

    // 1. Employee List Filtered
    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Employee Workload (Box 3)
    const selectedEmployeeWorkload = useMemo(() => {
        if (!selectedEmployee) return null;

        const empId = selectedEmployee._id;
        const assignedTasks = [];
        let processCount = 0;

        orders.forEach(order => {
            order.processAssignments?.forEach(assignment => {
                if (assignment.employeeId === empId) {
                    assignedTasks.push({
                        orderId: order.orderId,
                        process: assignment.processName,
                        date: assignment.assignedAt
                    });
                    processCount++;
                }
            });
        });

        return { assignedTasks, processCount };
    }, [selectedEmployee, orders]);

    // 3. Stats (Box 4)
    const stats = useMemo(() => {
        const totalEmployees = employees.length;
        const totalOrders = orders.length;
        let totalProcesses = 0;
        let unassignedProcesses = 0;

        orders.forEach(order => {
            // Total theoretically possible processes per order is 10.
            // But we count *assigned* vs *gap*.
            // Let's count actul assignments.
            const assignedCount = order.processAssignments?.length || 0;
            totalProcesses += assignedCount;
            // Unassigned is tricky, do we mean 'currently active stage unassigned' or 'all 10 stages'?
            // Providing simple metric: Total slots (Orders * 10) - Assigned
            unassignedProcesses += (PROCESS_STAGES.length - assignedCount);
        });

        return { totalEmployees, totalOrders, totalProcesses, unassignedProcesses };
    }, [employees, orders]);


    if (loading) return <div className="p-8 text-center text-slate-500">Loading Workspace...</div>;

    return (
        <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4 overflow-hidden">

            {/* 🟦 BOX 4: Global Summary (Now Top) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        <Layers size={16} className="text-slate-500" /> Workspace Overview
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-4 gap-6 items-center">
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-3xl font-bold text-slate-700">{stats.totalEmployees}</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">Total Employees</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-3xl font-bold text-indigo-600">{stats.totalOrders}</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">Active Orders</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-3xl font-bold text-emerald-600">{stats.totalProcesses}</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">Processes Assigned</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                        {stats.unassignedProcesses > 0 && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full animate-pulse border-2 border-white -mr-1 -mt-1"></div>
                        )}
                        <span className="text-3xl font-bold text-amber-500">{stats.unassignedProcesses}</span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">Pending Assignment</span>
                    </div>
                </div>
            </div>

            {/* Middle Row: Employee List (Left) & Right Column (Map + Parties) */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

                {/* 🟦 BOX 1: Employee List */}
                <div className="w-1/4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-600" /> Select Employee
                        </h2>
                        <div className="mt-3 relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredEmployees.map(emp => {
                            const isSelected = selectedEmployee?._id === emp._id;

                            return (
                                <div
                                    key={emp._id}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`
                                        rounded-lg cursor-pointer border transition-all duration-200 group overflow-hidden
                                        ${isSelected
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 shadow-sm'
                                            : 'bg-white p-3 hover:bg-slate-50 border-transparent hover:border-slate-200'}
                                    `}
                                >
                                    <div className={`flex justify-between items-start ${isSelected ? 'p-3 pb-2' : ''}`}>
                                        <div>
                                            <div className={`font-medium text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                                {emp.fullName}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">{emp.employeeId}</div>
                                        </div>
                                        {emp.status === 'Active' && (
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm ${emp.calculatedStatus === 'Busy'
                                                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                                                    : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                                                    }`}
                                                title={emp.calculatedStatus}
                                            ></div>
                                        )}
                                    </div>

                                    {/* 🔽 Accordion Details (Only for Selected) */}
                                    {isSelected && (
                                        <div className="px-3 pb-3 pt-2 border-t border-blue-100/50 mt-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Active Tasks</span>
                                                <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 rounded-full font-medium">
                                                    {selectedEmployeeWorkload?.processCount || 0}
                                                </span>
                                            </div>

                                            {selectedEmployeeWorkload?.assignedTasks?.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {selectedEmployeeWorkload.assignedTasks.map((task, i) => (
                                                        <div key={i} className="bg-white/60 p-1.5 rounded border border-blue-100 flex items-center justify-between">
                                                            <div className="truncate pr-2">
                                                                <div className="text-[11px] font-semibold text-slate-700 leading-tight truncate" title={task.process}>{task.process}</div>
                                                                <div className="text-[10px] text-slate-400 leading-tight">{task.orderId}</div>
                                                            </div>
                                                            <div className="text-[9px] text-slate-400 whitespace-nowrap">
                                                                {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-2 text-xs text-slate-400 italic">
                                                    No active assignments
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Process Map (Top) & Parties (Bottom) */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">

                    {/* 🟦 BOX 2: Order Process Mapping */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Layers size={18} className="text-indigo-600" /> Process Assignment Map
                            </h2>
                            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                Assigning: <span className="text-blue-600">{selectedEmployee ? selectedEmployee.fullName : 'None Selected'}</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 bg-slate-50/30">
                            {orders.map(order => {
                                const isExpanded = expandedOrderIds[order.orderId];
                                const assignedCount = order.processAssignments?.length || 0;
                                const progress = Math.round((assignedCount / PROCESS_STAGES.length) * 100);

                                return (
                                    <div key={order._id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                        {/* Order Header */}
                                        <div
                                            onClick={() => toggleOrderExpand(order.orderId)}
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-1.5 rounded-md transition-transform duration-200 ${isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-90' : 'text-slate-400'}`}>
                                                    <ChevronRight size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                        {order.description}
                                                        <span className="text-xs font-normal text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">{order.orderId}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Process Map */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                                                {/* Items List (Brief) */}
                                                {order.items?.length > 0 && (
                                                    <div className="mb-4 flex flex-wrap gap-2">
                                                        {order.items.map((item, idx) => (
                                                            <span key={idx} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 shadow-sm">
                                                                📦 {item.itemName} <span className="text-slate-400">({item.jobNo})</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Process Grid */}
                                                <div className="grid grid-cols-5 gap-3">
                                                    {PROCESS_STAGES.map((stage, idx) => {
                                                        const assignment = order.processAssignments?.find(a => a.processName === stage);
                                                        const assignedEmp = employees.find(e => e._id === assignment?.employeeId);

                                                        return (
                                                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col gap-2 transition-all hover:border-blue-200 hover:shadow-sm group">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {idx + 1}</span>
                                                                    {assignedEmp && <CheckCircle size={12} className="text-emerald-500" />}
                                                                </div>
                                                                <div className="font-medium text-sm text-slate-700 leading-tight">{stage}</div>

                                                                {assignedEmp ? (
                                                                    <div
                                                                        onClick={() => selectedEmployee && handleAssign(order._id, stage, selectedEmployee._id)}
                                                                        className="mt-1 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 cursor-pointer hover:bg-emerald-100 transition-colors"
                                                                        title="Click to re-assign selected employee"
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                                                                            {assignedEmp.fullName.charAt(0)}
                                                                        </div>
                                                                        <div className="truncate text-xs font-medium text-emerald-800">
                                                                            {assignedEmp.fullName}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => selectedEmployee ? handleAssign(order._id, stage, selectedEmployee._id) : alert('Please select an employee from the left panel first.')}
                                                                        disabled={!selectedEmployee}
                                                                        className={`
                                                                        mt-1 w-full text-xs py-1.5 rounded border border-dashed text-center transition-all
                                                                        ${selectedEmployee
                                                                                ? 'border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                                                                                : 'border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed'}
                                                                    `}
                                                                    >
                                                                        {selectedEmployee ? '+ Assign' : 'Unassigned'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 🟦 BOX 3: Parties Section */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0 min-h-[500px]">
                        <PartiesComponent />
                    </div>

                </div>
            </div>


        </div>
    );
};

export default Employees;
