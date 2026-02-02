import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Scissors, CheckCircle, Clock, Filter, UserPlus, Split, MoreVertical, Package, ShoppingBag, User, ChevronDown, Calendar, XCircle } from 'lucide-react';
import { getJobCards, updateJobCardSteps, splitJobCard, getEmployees, getAllOrders, planProduction, getAllItems, getRawMaterials } from '../../services/api';
import { getParties } from '../../services/partyApi';

export default function ProductionModule() {
    const [jobs, setJobs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [parties, setParties] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
    const [activeTab, setActiveTab] = useState('planning'); // 'planning' | 'execution'

    const [selectedJob, setSelectedJob] = useState(null);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitQty, setSplitQty] = useState(1);

    // Planning Modal States
    const [showPlanningModal, setShowPlanningModal] = useState(false);
    const [planningOrder, setPlanningOrder] = useState(null);
    const [planningItem, setPlanningItem] = useState(null);
    const [batchQty, setBatchQty] = useState(0);
    const [extraQty, setExtraQty] = useState(0);
    const [showExtraQty, setShowExtraQty] = useState(false);
    const [customSteps, setCustomSteps] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (activeTab === 'execution') {
                    await fetchJobs();
                } else {
                    await fetchOrders();
                }
                await fetchEmployees();
                // Fetch parties once
                const partyData = await getParties();
                setParties(partyData);
                const itemData = await getAllItems();
                setItems(Array.isArray(itemData) ? itemData : itemData.data || []);
            } catch (err) {
                console.error("Error fetching initial data", err);
            }
        };

        fetchAllData();

        const intervalId = setInterval(() => {
            if (activeTab === 'execution') {
                fetchJobs(true);
            } else {
                fetchOrders(true);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [activeTab]);

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

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await getAllOrders();
            const data = Array.isArray(res) ? res : (res.data || []);
            // Filter orders that are Confirmed or Processing and have items with pending plannedQty
            const pendingOrders = data.filter(order =>
                ((order.orderStage === 'Processing' || order.status === 'Processing' || order.orderStage === 'Confirmed') && order.orderStage !== 'Completed') &&
                order.items.some(item => (item.quantity - (item.plannedQty || 0)) > 0)
            );
            setOrders(pendingOrders);
        } catch (err) {
            if (!silent) setError('Failed to load orders');
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

    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    const handleOpenPlanningModal = (order, item) => {
        setPlanningOrder(order);
        setPlanningItem(item);
        const actualPlanned = (item.jobBatches || []).reduce((sum, b) => sum + (b.batchQty || 0), 0);
        const remaining = item.quantity - actualPlanned;
        setBatchQty(remaining > 0 ? remaining : 0);
        setExtraQty(0);
        setShowExtraQty(false);
        // Deep copy of master steps to allow local editing
        // Deep copy of master steps to allow local editing
        let steps = JSON.parse(JSON.stringify(item.manufacturingSteps || []));

        // Auto-inject FQC step for assignment if it's configured in Master Item but not in steps
        if (item.item?.finalQualityCheck?.length > 0) {
            const hasFQC = steps.some(s => s.stepName?.toLowerCase().includes('qc') || s.stepType === 'testing');
            if (!hasFQC) {
                steps.push({
                    stepName: 'Final Quality Check',
                    description: 'System mandatory final inspection',
                    stepType: 'testing',
                    timeToComplete: '1h',
                    assignedEmployees: [], // Allow assignment
                    isMandatoryFQC: true
                });
            }
        }

        setCustomSteps(steps.map(s => ({
            ...s,
            targetStartDate: formatDateForInput(s.targetStartDate),
            targetDeadline: formatDateForInput(s.targetDeadline)
        })));
        setShowPlanningModal(true);
    };

    const handleStartProduction = async () => {
        if (!planningOrder || !planningItem || batchQty <= 0) return;

        const remaining = planningItem.quantity - (planningItem.plannedQty || 0);
        if (batchQty > remaining) {
            alert(`Batch quantity cannot exceed remaining quantity (${remaining})`);
            return;
        }

        // Real-time Stock Validation for Raw Materials
        const shortages = [];
        if (planningItem.rmRequirements?.length > 0) {
            // Re-fetch items to get absolutely latest stock logic from RawMaterials
            const freshRMs = await getRawMaterials();
            const rmMap = Array.isArray(freshRMs) ? freshRMs : freshRMs.data || [];

            const qtyRatio = (batchQty + extraQty) / planningItem.quantity;
            planningItem.rmRequirements.forEach(rm => {
                const freshRM = rmMap.find(i =>
                    (i.code && i.code === rm.materialCode || i.code === rm.itemId) ||
                    (i.name && i.name.trim().toLowerCase() === (rm.name || rm.materialName).trim().toLowerCase())
                );

                const consumption = parseFloat(rm.consumptionPerUnit) || parseFloat(rm.quantity) || 0;
                const requiredNow = consumption * (batchQty + extraQty); // Total for this batch (unit consumption * batch qty)

                const availableNow = freshRM ? (freshRM.qty || 0) : 0;
                if (availableNow < requiredNow) {
                    shortages.push(`${rm.name}: Need ${requiredNow.toFixed(2)} ${freshRM?.uom || ''}, Have ${availableNow.toFixed(2)} ${freshRM?.uom || ''}`);
                }
            });
        }

        if (shortages.length > 0) {
            const proceed = window.confirm(`CRITICAL RM SHORTAGE DETECTED:\n\n${shortages.join('\n')}\n\nDo you want to proceed anyway? Production will be blocked at steps requiring these materials.`);
            if (!proceed) return;
        }

        // Check if we have manufacturing steps (either custom or from order)
        const hasOrderSteps = planningItem.manufacturingSteps && planningItem.manufacturingSteps.length > 0;
        if (customSteps.length === 0 && !hasOrderSteps) {
            alert('No manufacturing steps defined. Please add steps to this order item first before planning production.');
            return;
        }

        try {
            setLoading(true);
            await planProduction(planningOrder._id, planningItem._id, {
                batchQty,
                extraQty, // Send extra quantity separately
                customSteps
            });
            setShowPlanningModal(false);
            fetchOrders();
            setActiveTab('execution'); // Move to execution tab after planning
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start production');
        } finally {
            setLoading(false);
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

    const handleAssignEmployee = async (jobId, stepId, employeeOrList) => {
        try {
            const job = jobs.find(j => j._id === jobId);
            const updatedSteps = job.steps.map(s => {
                if (s._id === stepId) {
                    let newAssignments = [];
                    // Handle Array (Multi-select) vs Single ID (Legacy/Single-select)
                    if (Array.isArray(employeeOrList)) {
                        // employeeOrList is array of { employeeId, ... } or just IDs? 
                        // Let's assume the UI prepares the list of IDs.
                        // Actually, let's make the UI responsible for passing the full new list of IDs.
                        const currentIds = employeeOrList; // Array of ID strings
                        newAssignments = currentIds.map(id => ({ employeeId: id, assignedAt: new Date() }));
                    } else {
                        // Single ID case (Toggle logic or Replace?) 
                        // Let's assume this function replaces the list if passed a single ID, for backward compat with simple select.
                        if (employeeOrList) newAssignments = [{ employeeId: employeeOrList, assignedAt: new Date() }];
                    }

                    return {
                        ...s,
                        // If assignments exist, it's not Open. If empty, maybe Open? User should explicitly mark Open.
                        // For now: Assigning someone closes the "Open Job" status.
                        isOpenJob: newAssignments.length === 0,
                        assignedEmployees: newAssignments
                    };
                }
                return s;
            });
            await updateJobCardSteps(jobId, updatedSteps);
            fetchJobs();
        } catch (err) {
            console.error(err);
            setError('Failed to assign employee');
        }
    };

    const handleAddAssignee = async (jobId, stepId, employeeId) => {
        const job = jobs.find(j => j._id === jobId);
        const step = job.steps.find(s => s._id === stepId);
        const currentIds = step.assignedEmployees?.map(a => a.employeeId._id || a.employeeId) || [];
        // Avoid duplicates
        if (currentIds.includes(employeeId)) return;

        const newIds = [...currentIds, employeeId];
        await handleAssignEmployee(jobId, stepId, newIds);
    };

    const handleRemoveAssignee = async (jobId, stepId, employeeId) => {
        const job = jobs.find(j => j._id === jobId);
        const step = job.steps.find(s => s._id === stepId);
        const currentIds = step.assignedEmployees?.map(a => a.employeeId._id || a.employeeId) || [];
        const newIds = currentIds.filter(id => id !== employeeId);
        await handleAssignEmployee(jobId, stepId, newIds);
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
                        {/* Tab Toggle */}
                        <div className="flex bg-white p-1 rounded-md shadow-sm border border-slate-200">
                            <button
                                onClick={() => setActiveTab('planning')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'planning' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                PLANNING STAGE
                            </button>
                            <button
                                onClick={() => setActiveTab('execution')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'execution' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                EXECUTION (JOBS)
                            </button>
                        </div>
                    </div>
                </div>

                {loading && !jobs.length && !orders.length ? (
                    <div className="flex items-center justify-center p-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                        Loading...
                    </div>
                ) : activeTab === 'planning' ? (
                    /* PLANNING VIEW */
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg p-20 text-center border-2 border-dashed border-slate-200">
                                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800">No Orders for Planning</h3>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 italic">Create and confirm new orders to see them here for production allocation.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{order.partyName}</h3>
                                            <p className="text-xs text-slate-500">PO: {order.poNumber || 'N/A'} | Date: {new Date(order.poDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                {order.orderStage}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="pb-3 px-2">Item Name</th>
                                                    <th className="pb-3 px-2">Total Ordered</th>
                                                    <th className="pb-3 px-2">Planned Qty</th>
                                                    <th className="pb-3 px-2">Remaining</th>
                                                    <th className="pb-3 px-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {order.items.filter(item => (item.quantity - (item.plannedQty || 0)) > 0).map(item => (
                                                    <tr key={item._id} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 px-2">
                                                            <p className="text-sm font-bold text-slate-800">{item.itemName}</p>
                                                            <p className="text-[10px] font-mono text-slate-400">{item.item?.code || 'NO SKU'}</p>
                                                        </td>
                                                        <td className="py-4 px-2 text-sm font-medium text-slate-700">{item.quantity} {item.unit}</td>
                                                        <td className="py-4 px-2 text-sm font-medium text-indigo-600">{item.plannedQty || 0} {item.unit}</td>
                                                        <td className="py-4 px-2">
                                                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded text-xs font-black">
                                                                {item.quantity - (item.plannedQty || 0)} {item.unit}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-2 text-right">
                                                            <button
                                                                onClick={() => handleOpenPlanningModal(order, item)}
                                                                className="bg-slate-900 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-slate-800 transition shadow-sm uppercase tracking-tight"
                                                            >
                                                                Allocate Batch
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* EXECUTION VIEW */
                    <>
                        <div className="flex justify-end mb-6">
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

                            {viewMode === 'list' && (
                                <div className="flex bg-white p-1 rounded-md shadow-sm border border-slate-200 ml-4">
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

                        {viewMode === 'list' ? (
                            <div className="grid grid-cols-1 gap-6">
                                {filteredJobs.map(job => (
                                    <div key={job._id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row group hover:shadow-md transition-all duration-300">
                                        <div className="p-6 lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between bg-slate-50/50">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="bg-white text-indigo-600 px-3 py-1 rounded-md text-[10px] font-black tracking-wider shadow-sm border border-indigo-100 uppercase">
                                                        Job: {job.jobNumber}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{job.itemId?.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">{job.itemId?.code || 'NO SKU'}</p>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-white rounded-md border border-slate-200/60 shadow-sm">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Batch Qty</div>
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
                                                            {job.steps ? Math.round((job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                                                            style={{ width: `${job.steps ? (job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100 : 0}%` }}
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

                                        <div className="p-8 flex-1 overflow-x-auto custom-scrollbar">
                                            <div className="flex items-start gap-8 min-w-max pb-4">
                                                {job.steps?.map((step, idx) => (
                                                    <div key={idx} className="flex flex-col gap-3 group/step relative">
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
                                                            {step.timeToComplete && (
                                                                <div className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded flex items-center gap-1 border border-slate-200">
                                                                    <Clock size={10} /> {step.timeToComplete}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="w-56 bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1 truncate mb-2" title={step.stepName}>{step.stepName}</h4>

                                                            {/* Assignment Section */}
                                                            <div className="mb-2 space-y-2">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {step.assignedEmployees?.map((ae, aeIdx) => {
                                                                        // Robust ID extraction
                                                                        const rawId = ae.employeeId;
                                                                        const empId = (typeof rawId === 'object' && rawId !== null)
                                                                            ? (rawId._id || rawId.id)
                                                                            : rawId;

                                                                        // Find employee in list (handle string/ObjectId mismatch)
                                                                        const emp = employees.find(e => {
                                                                            const currentId = e._id || e.id;
                                                                            return currentId === empId || String(currentId) === String(empId);
                                                                        });

                                                                        // Fallback to populated name if available, or 'Unknown'
                                                                        const empName = emp?.name || emp?.fullName || (typeof rawId === 'object' ? (rawId.name || rawId.fullName) : null) || 'Unknown';

                                                                        if (empName === 'Unknown') {
                                                                            console.warn(`[ProdModule] Unknown Employee ID: ${empId}`, {
                                                                                rawId,
                                                                                availableEmployees: employees.length
                                                                            });
                                                                        }

                                                                        return (
                                                                            <span key={`${empId}-${aeIdx}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold">
                                                                                {empName}
                                                                                <button
                                                                                    onClick={() => handleRemoveAssignee(job._id, step._id, empId)}
                                                                                    className="hover:text-blue-900"
                                                                                >
                                                                                    <XCircle size={10} />
                                                                                </button>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {(!step.assignedEmployees || step.assignedEmployees.length === 0) && (
                                                                        <span className="text-[9px] text-slate-400 italic pl-1">Unassigned</span>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <input
                                                                        list={`employees-list-${step._id}`}
                                                                        className="w-full text-[10px] font-bold pl-7 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer text-slate-600 hover:bg-white transition-colors"
                                                                        placeholder="+ Add Specialist..."
                                                                        onChange={(e) => {
                                                                            if (e.target.value) {
                                                                                const emp = employees.find(emp => emp.name === e.target.value || emp.fullName === e.target.value);
                                                                                if (emp) {
                                                                                    handleAddAssignee(job._id, step._id, emp._id);
                                                                                    e.target.value = "";
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                    <datalist id={`employees-list-${step._id}`}>
                                                                        {employees.filter(emp => !step.assignedEmployees?.some(ae => (ae.employeeId?._id || ae.employeeId) === emp._id)).map(emp => (
                                                                            <option key={emp._id} value={emp.name || emp.fullName} />
                                                                        ))}
                                                                    </datalist>
                                                                    <UserPlus size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                </div>
                                                            </div>

                                                            {/* Dates Section */}
                                                            {(step.targetStartDate || step.targetDeadline) && (
                                                                <div className="flex gap-2 mb-2 p-1.5 bg-slate-50 rounded border border-slate-100">
                                                                    {step.targetStartDate && (
                                                                        <div className="flex-1 text-[8px] font-bold text-slate-500 uppercase truncate">
                                                                            <span className="opacity-50">Start:</span> {new Date(step.targetStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                        </div>
                                                                    )}
                                                                    {step.targetDeadline && (
                                                                        <div className="flex-1 text-[8px] font-bold text-rose-500 uppercase truncate text-right">
                                                                            <span className="opacity-50">End:</span> {new Date(step.targetDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Buttons Section */}
                                                            <div className="grid grid-cols-2 gap-1">
                                                                <button
                                                                    onClick={() => handleAssignEmployee(job._id, step._id, step.employeeId)}
                                                                    className="col-span-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-200 transition uppercase tracking-wider"
                                                                >Save Assign</button>
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
                                        <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 italic">Allocate production batches in the Planning Stage to see active jobs here.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
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
                                                <div key={job._id} className="bg-white p-4 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                                    <div className="mb-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{job.jobNumber}</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-800 mb-1 leading-snug">{job.itemId?.name}</h4>

                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="text-xs font-medium text-slate-500">{job.quantity} {job.itemId?.unit}</span>
                                                        {job.extraQty > 0 && (
                                                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                +{job.extraQty} Extra
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Step Progress</span>
                                                            <span className="text-[8px] font-bold text-indigo-600">{job.steps ? Math.round((job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100) : 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${col.id === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                                style={{ width: `${job.steps ? (job.steps.filter(s => s.status === 'completed').length / job.steps.length) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-4">
                                                            <span>PO: {job.orderId?.poNumber}</span>
                                                            {job.deliveryDate && (
                                                                <span className="flex items-center gap-1 text-rose-500">
                                                                    <Calendar size={10} /> {new Date(job.deliveryDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* PLANNING MODAL */}
            {
                showPlanningModal && planningOrder && planningItem && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Production Planning</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Allocating batch for <span className="text-slate-900 font-bold">{planningItem.itemName}</span> from Order <span className="text-slate-900 font-bold">#{planningOrder.poNumber}</span>
                                    </p>
                                </div>
                                <button onClick={() => setShowPlanningModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                    <Filter size={20} className="rotate-45" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Side: Quantity and Info */}
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Batch Allocation</h4>
                                            <div className="mb-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Allocated from Order</label>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        Max: {(planningItem.quantity - (planningItem.plannedQty || 0))} {planningItem.unit}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={batchQty}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                const max = planningItem.quantity - (planningItem.plannedQty || 0);
                                                                setBatchQty(val > max ? max : val); // Strict Limit
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none pl-4"
                                                            placeholder="0"
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 border border-indigo-100 shadow-sm pointer-events-none">
                                                            KEY ORDER
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs w-12">{planningItem.unit}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-400 font-medium">Original Order:</span>
                                                    <span className="text-slate-900 font-bold">{planningItem.quantity}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-400 font-medium">Already Planned:</span>
                                                    <span className="text-slate-600 font-bold">{planningItem.plannedQty || 0}</span>
                                                </div>
                                            </div>

                                            {/* Extra Production Toggle */}
                                            {/* Extra Production Section - Always Visible but Distinct */}
                                            <div className="mt-8">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="h-px bg-slate-200 flex-1"></div>
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded border border-amber-100">Optional Buffer</span>
                                                    <div className="h-px bg-slate-200 flex-1"></div>
                                                </div>

                                                <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100/60 dashed-border">
                                                    <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">Additional / Extra Quantity</label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                value={extraQty}
                                                                onChange={(e) => setExtraQty(Math.max(0, parseFloat(e.target.value) || 0))}
                                                                className="w-full bg-white border border-amber-200 rounded-md p-2 pl-4 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-amber-200"
                                                                placeholder="0"
                                                                min={0}
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold text-amber-700 pointer-events-none">
                                                                BUFFER
                                                            </div>
                                                        </div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs w-12">{planningItem.unit}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                                        Add extra stock for expected wastage or buffer. This enters inventory but <strong>does not</strong> count towards the original order fulfillment.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-6 p-4 bg-slate-900 rounded-lg text-white">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Batch Size</span>
                                                    <span className="text-xl font-black">{batchQty + extraQty}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 text-right uppercase tracking-widest font-bold">{planningItem.unit}</div>
                                            </div>

                                        </div>

                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                            <p className="text-indigo-700 text-xs font-bold leading-relaxed">
                                                🚀 Starting production will generate a unique Job Number for this batch and notify assigned employees.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Custom Steps */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manufacturing Steps for this Batch</h4>
                                                <button
                                                    onClick={() => setCustomSteps([...customSteps, { id: Date.now(), stepName: '', description: '', stepType: 'execution' }])}
                                                    className="text-indigo-600 text-[10px] font-black uppercase hover:underline"
                                                >
                                                    + Add Custom Step
                                                </button>
                                            </div>

                                            {/* Show message if no steps available */}
                                            {customSteps.length === 0 && (!planningItem.manufacturingSteps || planningItem.manufacturingSteps.length === 0) && (
                                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                                                    <p className="text-amber-700 text-xs font-bold">⚠️ No manufacturing steps defined in this order. You must either:</p>
                                                    <ul className="text-amber-600 text-xs font-medium mt-2 ml-4 list-disc space-y-1">
                                                        <li>Add custom steps below for this batch, OR</li>
                                                        <li>Define manufacturing steps in the order first</li>
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {customSteps.map((step, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-md border border-slate-200 group relative">
                                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Step Name</label>
                                                                <input
                                                                    value={step.stepName}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].stepName = e.target.value;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-bold"
                                                                    placeholder="Enter step name..."
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Assign Employees (Multi)</label>
                                                                <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded min-h-[32px]">
                                                                    {(step.assignedEmployees || []).map(ae => (
                                                                        <span key={ae.employeeId} className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                                                                            {(() => {
                                                                                const emp = employees.find(e => e._id === ae.employeeId);
                                                                                return emp?.name || emp?.fullName || 'Unknown';
                                                                            })()}
                                                                            <XCircle size={10} className="cursor-pointer" onClick={() => {
                                                                                const newSteps = [...customSteps];
                                                                                newSteps[idx].assignedEmployees = newSteps[idx].assignedEmployees.filter(x => x.employeeId !== ae.employeeId);
                                                                                setCustomSteps(newSteps);
                                                                            }} />
                                                                        </span>
                                                                    ))}
                                                                    <select
                                                                        className="flex-1 bg-transparent border-none outline-none text-[10px] min-w-[80px]"
                                                                        onChange={(e) => {
                                                                            if (!e.target.value) return;
                                                                            const newSteps = [...customSteps];
                                                                            if (!newSteps[idx].assignedEmployees) newSteps[idx].assignedEmployees = [];
                                                                            if (!newSteps[idx].assignedEmployees.some(ae => ae.employeeId === e.target.value)) {
                                                                                newSteps[idx].assignedEmployees.push({ employeeId: e.target.value, assignedAt: new Date() });
                                                                                setCustomSteps(newSteps);
                                                                            }
                                                                            e.target.value = "";
                                                                        }}
                                                                    >
                                                                        <option value="">Add Employee...</option>
                                                                        {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name || emp.fullName}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* New: Open Job & Outsource Toggle */}
                                                        <div className="flex items-center gap-6 mb-3">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!step.isOpenJob}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].isOpenJob = e.target.checked;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-3 h-3 text-blue-600 rounded"
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Open Job</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!step.isOutward}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].isOutward = e.target.checked;
                                                                        if (e.target.checked && !newSteps[idx].outwardDetails) {
                                                                            newSteps[idx].outwardDetails = { partyName: '', sentDate: '', returnDate: '', internalHandler: '' };
                                                                        }
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-3 h-3 text-amber-600 rounded"
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Outsource</span>
                                                            </label>
                                                        </div>

                                                        {/* Outward Details */}
                                                        {step.isOutward && (
                                                            <div className="grid grid-cols-4 gap-3 mb-3 p-3 bg-amber-50 rounded border border-amber-100">
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-amber-600 uppercase mb-1">Vendor</label>
                                                                    <select
                                                                        value={step.outwardDetails?.partyName || ''}
                                                                        onChange={(e) => {
                                                                            const newSteps = [...customSteps];
                                                                            newSteps[idx].outwardDetails.partyName = e.target.value;
                                                                            setCustomSteps(newSteps);
                                                                        }}
                                                                        className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px]"
                                                                    >
                                                                        <option value="">Select Vendor...</option>
                                                                        {parties.map(p => (
                                                                            <option key={p._id} value={p.name}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-amber-600 uppercase mb-1">Sent Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={step.outwardDetails?.sentDate || ''}
                                                                        onChange={(e) => {
                                                                            const newSteps = [...customSteps];
                                                                            newSteps[idx].outwardDetails.sentDate = e.target.value;
                                                                            setCustomSteps(newSteps);
                                                                        }}
                                                                        className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-amber-600 uppercase mb-1">Expected Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={step.outwardDetails?.returnDate || ''}
                                                                        onChange={(e) => {
                                                                            const newSteps = [...customSteps];
                                                                            newSteps[idx].outwardDetails.returnDate = e.target.value;
                                                                            setCustomSteps(newSteps);
                                                                        }}
                                                                        className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[8px] font-black text-amber-600 uppercase mb-1">Internal Handler</label>
                                                                    <select
                                                                        value={step.outwardDetails?.internalHandler || ''}
                                                                        onChange={(e) => {
                                                                            const newSteps = [...customSteps];
                                                                            newSteps[idx].outwardDetails.internalHandler = e.target.value;
                                                                            setCustomSteps(newSteps);
                                                                        }}
                                                                        className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-[10px]"
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name || emp.fullName}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Description</label>
                                                                <input
                                                                    value={step.description}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].description = e.target.value;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-medium text-slate-500"
                                                                    placeholder="Brief instructions..."
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Estimated Time</label>
                                                                <input
                                                                    value={step.timeToComplete}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].timeToComplete = e.target.value;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-medium text-slate-500"
                                                                    placeholder="e.g. 2 hours"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                                    <Calendar size={8} /> Start Date
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={step.targetStartDate || ''}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].targetStartDate = e.target.value;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                                    <Calendar size={8} /> End Date
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={step.targetDeadline || ''}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...customSteps];
                                                                        newSteps[idx].targetDeadline = e.target.value;
                                                                        setCustomSteps(newSteps);
                                                                    }}
                                                                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setCustomSteps(customSteps.filter((_, i) => i !== idx))}
                                                            className="absolute -right-2 -top-2 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Filter size={10} className="rotate-45" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {customSteps.length === 0 && (
                                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-lg">
                                                        <p className="text-slate-400 text-xs font-bold uppercase">No steps defined for this batch</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-white flex gap-4">
                                <button
                                    onClick={() => setShowPlanningModal(false)}
                                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-md transition uppercase text-xs tracking-widest"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleStartProduction}
                                    disabled={batchQty <= 0 || loading}
                                    className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-md shadow-lg shadow-slate-100 hover:bg-slate-800 transition uppercase text-xs tracking-widest disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'START MANUFACTURING & GENERATE JOB CARD'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

