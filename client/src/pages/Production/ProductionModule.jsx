import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Scissors, CheckCircle, Clock, Filter, UserPlus, Split, MoreVertical, Package, ShoppingBag, User, ChevronDown } from 'lucide-react';
import { getJobCards, updateJobCardSteps, splitJobCard, getEmployees } from '../../services/api';

export default function ProductionModule() {
    const [jobs, setJobs] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'

    const [selectedJob, setSelectedJob] = useState(null);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitQty, setSplitQty] = useState(1);

    useEffect(() => {
        fetchJobs();
        fetchEmployees();

        const intervalId = setInterval(() => {
            fetchJobs(true); // Silent fetch
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchJobs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getJobCards();
            setJobs(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            if (!silent) setError('Failed to load job cards');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getEmployees();
            setEmployees(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            console.error('Error loading employees:', err);
        }
    };

    const handleStepStatusUpdate = async (jobId, stepId, newStatus) => {
        try {
            const job = jobs.find(j => j._id === jobId);
            const updatedSteps = job.steps.map(s =>
                s._id === stepId ? { ...s, status: newStatus, ...(newStatus === 'in-progress' ? { startTime: new Date() } : newStatus === 'completed' ? { endTime: new Date() } : {}) } : s
            );
            await updateJobCardSteps(jobId, updatedSteps);
            fetchJobs();
        } catch (err) {
            setError('Failed to update step status');
        }
    };

    const handleAssignEmployee = async (jobId, stepId, employeeId) => {
        try {
            const job = jobs.find(j => j._id === jobId);
            const updatedSteps = job.steps.map(s =>
                s._id === stepId ? { ...s, employeeId } : s
            );
            await updateJobCardSteps(jobId, updatedSteps);
            fetchJobs();
        } catch (err) {
            setError('Failed to assign employee');
        }
    };

    const handleSplitJob = async () => {
        if (!selectedJob || splitQty <= 0 || splitQty >= selectedJob.quantity) return;
        try {
            await splitJobCard(selectedJob._id, splitQty);
            setShowSplitModal(false);
            setSplitQty(1); // Reset
            fetchJobs();
        } catch (err) {
            setError('Failed to split job');
        }
    };

    const filteredJobs = jobs.filter(j => filter === 'All' || j.status === filter);

    const getDaysRemaining = (date) => {
        if (!date) return null;
        const diffTime = new Date(date) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getWorkforce = (jobSteps) => {
        const uniqueIds = [...new Set(jobSteps.map(s => s.employeeId).filter(Boolean))];
        return uniqueIds.map(id => employees.find(e => e._id === id)?.name).filter(Boolean);
    };

    // Kanban Helper
    const getJobsByStatus = (status) => jobs.filter(j => j.status === status);

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Production Dashboard</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage job cards, assign employees, and track manufacturing progress.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex bg-white p-1 rounded-md shadow-sm border border-slate-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <LayoutDashboard size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Kanban Board View"
                            >
                                <MoreVertical size={18} className="rotate-90" />
                            </button>
                        </div>

                        {/* Filter - Only show in List Mode or if relevant */}
                        {viewMode === 'list' && (
                            <div className="flex bg-white p-1 rounded-md shadow-sm border border-slate-200">
                                {['All', 'Created', 'InProgress', 'Completed'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                        Loading Job Cards...
                    </div>
                ) : viewMode === 'list' ? (
                    // LIST VIEW
                    <div className="grid grid-cols-1 gap-6">
                        {filteredJobs.map(job => (
                            <div key={job._id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row group hover:shadow-md transition-all duration-300">
                                {/* Left: Job Info */}
                                <div className="p-6 lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between bg-slate-50/50">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="bg-white text-indigo-600 px-3 py-1 rounded-md text-[10px] font-black tracking-wider shadow-sm border border-indigo-100 uppercase">
                                                Batch: {job.jobNumber}
                                            </span>
                                            <button onClick={() => { setSelectedJob(job); setShowSplitModal(true); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50">
                                                <Split size={16} />
                                            </button>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{job.itemId?.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">{job.itemId?.code || 'NO SKU'}</p>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white rounded-md border border-slate-200/60 shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Qty</div>
                                                <div className="text-sm font-black text-slate-900">{job.quantity} <span className="text-[10px] text-slate-400 font-bold">{job.itemId?.unit}</span></div>
                                            </div>

                                            <div className="p-3 bg-white rounded-md border border-slate-200/60 shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Parent Order</div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{job.orderId?.partyName}</div>
                                                    <span className="text-[10px] font-mono text-slate-400">#{job.orderId?.poNumber}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-200/60">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-[10px] font-black text-indigo-600">
                                                    {Math.round((job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                                                    style={{ width: `${(job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className={`w-full py-2.5 rounded-md text-center text-[10px] font-black uppercase tracking-widest border ${job.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            job.status === 'InProgress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-white text-slate-400 border-slate-200'
                                            }`}>
                                            {job.status === 'InProgress' ? 'In Progress' : job.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Steps Tracker */}
                                <div className="p-8 flex-1 overflow-x-auto custom-scrollbar">
                                    <div className="flex items-start gap-8 min-w-max pb-4">
                                        {job.steps.map((step, idx) => (
                                            <div key={idx} className="flex flex-col gap-3 group/step relative">
                                                {/* Connector Line */}
                                                {idx < job.steps.length - 1 && (
                                                    <div className={`absolute left-[30px] top-[26px] h-0.5 w-[calc(100%+32px)] -z-10 transition-colors ${step.status === 'completed' ? 'bg-indigo-600' : 'bg-slate-200'
                                                        }`}></div>
                                                )}

                                                <div className="flex items-center gap-3">
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm border-4 ${step.status === 'completed' ? 'bg-indigo-600 border-indigo-100 text-white' :
                                                        step.status === 'in-progress' ? 'bg-white border-amber-100 text-amber-500 ring-2 ring-amber-50' :
                                                            'bg-white border-slate-100 text-slate-300'
                                                        }`}>
                                                        {step.status === 'completed' ? <CheckCircle size={20} className="stroke-[3]" /> :
                                                            step.status === 'in-progress' ? <Clock size={20} className="stroke-[3] animate-pulse" /> :
                                                                <span className="text-xs font-black">{idx + 1}</span>}
                                                    </div>

                                                    {step.status === 'in-progress' && (
                                                        <div className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-100">
                                                            Active
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-56 bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 truncate mb-2" title={step.stepName}>{step.stepName}</h4>

                                                    {/* Assignment Select */}
                                                    <div className="relative mb-2">
                                                        <select
                                                            className="w-full text-[10px] font-bold pl-7 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 appearance-none outline-none cursor-pointer text-slate-600"
                                                            value={step.employeeId || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setJobs(prev => prev.map(j => j._id === job._id ? {
                                                                    ...j,
                                                                    steps: j.steps.map(s => s._id === step._id ? { ...s, employeeId: val } : s)
                                                                } : j));
                                                            }}
                                                        >
                                                            <option value="">Assign Specialist...</option>
                                                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name || emp.fullName}</option>)}
                                                        </select>
                                                        <User size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <button
                                                            onClick={() => handleAssignEmployee(job._id, step._id, step.employeeId)}
                                                            className="col-span-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-200 transition uppercase tracking-wider"
                                                        >
                                                            Save Assign
                                                        </button>
                                                        <button
                                                            onClick={() => handleStepStatusUpdate(job._id, step._id, 'in-progress')}
                                                            disabled={step.status !== 'pending'}
                                                            className={`py-1 text-[9px] font-bold rounded uppercase transition ${step.status === 'in-progress' ? 'bg-amber-100 text-amber-700 opacity-50 cursor-not-allowed' :
                                                                step.status === 'completed' ? 'opacity-20 cursor-not-allowed bg-slate-100' :
                                                                    'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                                }`}
                                                        >Start</button>
                                                        <button
                                                            onClick={() => handleStepStatusUpdate(job._id, step._id, 'completed')}
                                                            disabled={step.status === 'completed'}
                                                            className={`py-1 text-[9px] font-bold rounded uppercase transition ${step.status === 'completed' ? 'bg-emerald-100 text-emerald-700 opacity-50 cursor-not-allowed' :
                                                                'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                }`}
                                                        >Finish</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredJobs.length === 0 && (
                            <div className="bg-white rounded-lg p-20 text-center border-2 border-dashed border-slate-200">
                                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800">No Job Cards Found</h3>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 italic">Confirm some orders to automatically generate production batches and job cards here.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // KANBAN BOARD VIEW
                    <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                        {[
                            { id: 'Created', label: 'To Do / Pending', color: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
                            { id: 'InProgress', label: 'In Execution', color: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
                            { id: 'Completed', label: 'Finished Batches', color: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' }
                        ].map(col => (
                            <div key={col.id} className={`flex-1 min-w-[320px] rounded-lg border flex flex-col ${col.color}`}>
                                <div className="p-4 border-b border-white/50 bg-white/50 flex justify-between items-center rounded-t-lg">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">{col.label}</h3>
                                    </div>
                                    <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-100">
                                        {getJobsByStatus(col.id).length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                    {getJobsByStatus(col.id).map(job => (
                                        <div key={job._id} className="bg-white p-4 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => { setSelectedJob(job); /* Add preview logic if needed */ }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{job.jobNumber}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowSplitModal(true); }}
                                                    className="text-slate-300 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Split size={14} />
                                                </button>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug">{job.itemId?.name}</h4>

                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-xs font-medium text-slate-500">{job.quantity} {job.itemId?.unit}</span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Step Progress</span>
                                                    <span className="text-[8px] font-bold text-indigo-600">{Math.round((job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${col.id === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                        style={{ width: `${(job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Active Worker Avatars */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex -space-x-1.5">
                                                    {getWorkforce(job.steps).slice(0, 3).map((name, i) => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase" title={name}>
                                                            {name.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {getWorkforce(job.steps).length > 3 && (
                                                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-bold text-slate-500">
                                                            +{getWorkforce(job.steps).length - 3}
                                                        </div>
                                                    )}
                                                </div>

                                                {col.id === 'Completed' ? (
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                                        <CheckCircle size={10} /> Completed
                                                    </span>
                                                ) : (
                                                    <div className="text-[9px] font-bold text-slate-400">
                                                        PO: {job.orderId?.poNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {getJobsByStatus(col.id).length === 0 && (
                                        <div className="text-center py-10 opacity-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Split Job Modal */}
            {
                showSplitModal && selectedJob && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Split Production Batch</h3>
                            <p className="text-slate-500 text-sm mb-6 uppercase font-bold tracking-tight">TOTAL AVAILABLE: {selectedJob.quantity} {selectedJob.itemId?.unit}</p>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity for Current Job</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border-none rounded-md p-4 text-xl font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={splitQty}
                                        onChange={(e) => setSplitQty(parseInt(e.target.value) || 0)}
                                        max={selectedJob.quantity - 1}
                                        min={1}
                                    />
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-md">
                                    <p className="text-indigo-700 text-xs font-bold leading-relaxed italic">
                                        * This will keep {splitQty} units in the current job card and move {selectedJob.quantity - splitQty} units to a NEW job card for independent tracking.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowSplitModal(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-md transition uppercase text-xs tracking-widest"
                                >CANCEL</button>
                                <button
                                    onClick={handleSplitJob}
                                    className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-md shadow-lg shadow-slate-200 hover:bg-slate-800 transition uppercase text-xs tracking-widest"
                                >CONFIRM SPLIT</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

