import React, { useState, useEffect } from 'react';
import { getEmployeeWorkload } from '../../services/api';
import { Users, Briefcase, ClipboardCheck, Clock, CheckCircle, AlertCircle, ChevronRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeWorkloadManagement = () => {
    const [workloads, setWorkloads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, busy, available

    useEffect(() => {
        fetchWorkload();
    }, []);

    const fetchWorkload = async () => {
        try {
            setLoading(true);
            const data = await getEmployeeWorkload();
            setWorkloads(data);
            if (data.length > 0 && !selectedEmployee) {
                setSelectedEmployee(data[0]);
            }
        } catch (error) {
            console.error('Error fetching workload:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkloads = workloads.filter(emp => {
        const matchesSearch = emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'busy') return matchesSearch && emp.totalAssignments > 0;
        if (filter === 'available') return matchesSearch && emp.totalAssignments === 0;
        return matchesSearch;
    });

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'completed' || s === 'done') return 'bg-emerald-100 text-emerald-800';
        if (s === 'in-progress' || s === 'processing') return 'bg-blue-100 text-blue-800';
        if (s === 'failed') return 'bg-red-100 text-red-800';
        return 'bg-amber-100 text-amber-800';
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            {/* Header Area */}
            <div className="p-4 sm:p-6 bg-white border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Employee Job Tracker</h1>
                        <p className="text-sm text-slate-500">Monitor manufacturing jobs and administrative tasks across the team</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                            />
                        </div>
                        <button
                            onClick={fetchWorkload}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                            <Clock size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    {['all', 'busy', 'available'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                {/* Employee Sidebar */}
                <div className="lg:col-span-1 border-r border-slate-200 bg-white overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading workload data...</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredWorkloads.map(emp => (
                                <button
                                    key={emp._id}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`w-full p-4 flex items-center gap-4 text-left transition-all hover:bg-slate-50 ${selectedEmployee?._id === emp._id ? 'bg-blue-50 ring-1 ring-inset ring-blue-500/10' : ''
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-md flex items-center justify-center font-bold text-lg ${emp.totalAssignments > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {emp.employeeName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{emp.employeeName}</h3>
                                        <p className="text-xs text-slate-500 truncate">{emp.role}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                                <Briefcase size={10} /> {emp.totalAssignments - emp.adminTaskCount} Jobs
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600">
                                                <ClipboardCheck size={10} /> {emp.adminTaskCount} Tasks
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={selectedEmployee?._id === emp._id ? 'text-blue-500' : 'text-slate-300'} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                    {selectedEmployee ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedEmployee.totalAssignments}</p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Processing</p>
                                    <p className="text-2xl font-black text-blue-600">{selectedEmployee.processingCount}</p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Pending</p>
                                    <p className="text-2xl font-black text-amber-600">{selectedEmployee.pendingCount}</p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Completed</p>
                                    <p className="text-2xl font-black text-emerald-600">{selectedEmployee.doneCount}</p>
                                </div>
                            </div>

                            {/* Detailed Workload List */}
                            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900">Current Workload Details</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {selectedEmployee.tasks.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                                            <p className="text-sm font-medium">No active assignments for this employee</p>
                                        </div>
                                    ) : (
                                        selectedEmployee.tasks.map((task, idx) => (
                                            <div key={idx} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-md ${task.type === 'Administrative' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                            }`}>
                                                            {task.type === 'Administrative' ? <ClipboardCheck size={18} /> : <Briefcase size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-slate-900">{task.title || task.itemName}</h4>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                                                                    {task.status || 'Assigned'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {task.type === 'Administrative' ? 'Administrative Task' : `${task.stepName} (Ref: ${task.itemCode})`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right sm:text-right self-end sm:self-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned On</p>
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            {new Date(task.assignedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Users size={64} className="opacity-10 mb-4" />
                            <p className="font-medium text-lg text-center">Select an employee from the list<br />to view their detailed tracking</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeWorkloadManagement;

