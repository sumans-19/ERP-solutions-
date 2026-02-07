import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Scissors, CheckCircle, Clock, Filter, UserPlus, Split, MoreVertical, Package, ShoppingBag, User, ChevronDown, Calendar, XCircle, Search, Hash } from 'lucide-react';
import { getJobCards, updateJobCardSteps, splitJobCard, getEmployees, getAllOrders, planProduction, getAllItems, getRawMaterials } from '../../services/api';
import { getParties } from '../../services/partyApi';
import { useNotification } from '../../contexts/NotificationContext';
import CollapsibleJobCard from '../../components/CollapsibleJobCard';
import SearchableEmployeeSelect from '../../components/SearchableEmployeeSelect';

export default function ProductionModule() {
    const { showNotification } = useNotification();
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

    // Search states
    const [jobSearch, setJobSearch] = useState('');
    const [poSearch, setPoSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [expandedJobs, setExpandedJobs] = useState(new Set());

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
            if (!silent) showNotification('Failed to load job cards', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchOrders = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await getAllOrders();
            const allOrders = Array.isArray(res) ? res : res.data || [];
            const pendingOrders = allOrders.filter(
                order => (order.status !== 'Completed' && order.status !== 'Cancelled') &&
                    order.items?.some(item => (item.quantity - (item.plannedQty || 0)) > 0)
            );
            setOrders(pendingOrders);
        } catch (err) {
            if (!silent) showNotification('Failed to load orders', 'error');
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

    const fetchParties = async () => {
        try {
            const res = await getParties();
            setParties(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            console.error('Failed to load parties:', err);
        }
    };

    const fetchItems = async () => {
        try {
            const res = await getAllItems();
            setItems(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            console.error('Failed to load items:', err);
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchOrders();
        fetchEmployees();
        fetchParties();
        fetchItems();
    }, []);

    // Toggle job card expansion
    const toggleJobExpansion = (jobId) => {
        setExpandedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    // Advanced filtering with search
    const filteredJobs = jobs.filter(j => {
        // Status filter
        const statusMatch = filter === 'All' || j.status === filter;

        // Job number search
        const jobMatch = !jobSearch || j.jobNumber?.toLowerCase().includes(jobSearch.toLowerCase());

        // PO number search
        const poMatch = !poSearch || j.orderId?.poNumber?.toLowerCase().includes(poSearch.toLowerCase());

        // Item search (name or code)
        const itemMatch = !itemSearch ||
            j.itemId?.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
            j.itemId?.code?.toLowerCase().includes(itemSearch.toLowerCase());

        return statusMatch && jobMatch && poMatch && itemMatch;
    });

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
                        {/* Search & Filter Section */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <div className="flex flex-col gap-4">
                                {/* Search Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search Job Number..."
                                            value={jobSearch}
                                            onChange={(e) => setJobSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search PO Number..."
                                            value={poSearch}
                                            onChange={(e) => setPoSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Package className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search Item Name/Code..."
                                            value={itemSearch}
                                            onChange={(e) => setItemSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Status Filters & View Controls */}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {['All', 'Created', 'InProgress', 'Completed'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${filter === f
                                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="text-xs font-bold text-slate-400">
                                        {filteredJobs.length} Jobs Found
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Job Cards List */}
                        <div className="space-y-6">
                            {filteredJobs.length > 0 ? (
                                filteredJobs.map(job => (
                                    <CollapsibleJobCard
                                        key={job._id}
                                        job={job}
                                        isExpanded={expandedJobs.has(job._id)}
                                        onToggle={() => toggleJobExpansion(job._id)}
                                        employees={employees}
                                        onAssignEmployee={handleAssignEmployee}
                                        onAddAssignee={handleAddAssignee}
                                        onRemoveAssignee={handleRemoveAssignee}
                                        onStepStatusUpdate={handleStepStatusUpdate}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="text-slate-300" size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Jobs Found</h3>
                                    <p className="text-sm text-slate-500">Try adjusting your search filters or create a new job.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div >

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
                                                                const inputVal = e.target.value;
                                                                if (inputVal === '') {
                                                                    setBatchQty('');
                                                                    return;
                                                                }
                                                                const val = parseFloat(inputVal);
                                                                if (isNaN(val)) return;
                                                                const max = planningItem.quantity - (planningItem.plannedQty || 0);
                                                                setBatchQty(val > max ? max : Math.max(0, val));
                                                            }}
                                                            min="0"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none pl-4"
                                                            placeholder=""
                                                        />

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
                                                                onChange={(e) => {
                                                                    const inputVal = e.target.value;
                                                                    if (inputVal === '') {
                                                                        setExtraQty('');
                                                                        return;
                                                                    }
                                                                    const val = parseFloat(inputVal);
                                                                    if (isNaN(val)) return;
                                                                    setExtraQty(Math.max(0, val));
                                                                }}
                                                                className="w-full bg-white border border-amber-200 rounded-md p-2 pl-4 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-amber-200"
                                                                placeholder=""
                                                                min={0}
                                                            />

                                                        </div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs w-12">{planningItem.unit}</span>
                                                    </div>

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
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-md border border-slate-200 group relative mt-4">
                                                        <div className="absolute -left-3 -top-3 px-2 py-0.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white z-10 min-w-[60px]">
                                                            Step {idx + 1}
                                                        </div>
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
                                                                    <SearchableEmployeeSelect
                                                                        employees={employees}
                                                                        onSelect={(employeeId) => {
                                                                            const newSteps = [...customSteps];
                                                                            if (!newSteps[idx].assignedEmployees) newSteps[idx].assignedEmployees = [];
                                                                            if (!newSteps[idx].assignedEmployees.some(ae => ae.employeeId === employeeId)) {
                                                                                newSteps[idx].assignedEmployees.push({ employeeId: employeeId, assignedAt: new Date() });
                                                                                setCustomSteps(newSteps);
                                                                            }
                                                                        }}
                                                                        placeholder="Search and add employee..."
                                                                    />
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

