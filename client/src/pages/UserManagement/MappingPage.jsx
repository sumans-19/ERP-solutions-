import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Layers, Users, CheckCircle, ChevronDown, ChevronRight, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';

const MappingPage = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [expandedItems, setExpandedItems] = useState({});
    const [selectedSteps, setSelectedSteps] = useState({});
    const [expectedDates, setExpectedDates] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch items in "New" state
            const [itemsRes, employeesRes] = await Promise.all([
                axios.get(`${API_URL}/api/items/state/New`, { headers }),
                axios.get(`${API_URL}/api/employees`, { headers })
            ]);

            setItems(itemsRes.data);
            setEmployees(employeesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItemExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleEmployeeSelect = (itemId, stepId, employeeId) => {
        setSelectedSteps(prev => ({
            ...prev,
            [`${itemId}-${stepId}`]: employeeId
        }));
    };

    const handleDateChange = (itemId, stepId, date) => {
        setExpectedDates(prev => ({
            ...prev,
            [`${itemId}-${stepId}`]: date
        }));
    };

    const handleAssignStep = async (item, step) => {
        const key = `${item._id}-${step.id}`;
        const employeeId = selectedSteps[key];

        if (!employeeId) {
            alert('Please select an employee first');
            return;
        }

        const employee = employees.find(e => e._id === employeeId);
        if (!employee) return;

        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;

            await axios.post(
                `${API_URL}/api/items/${item._id}/assign-step`,
                {
                    processStepId: step.id,
                    employeeId: employee._id,
                    employeeName: employee.fullName,
                    expectedCompletionDate: expectedDates[key] || null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Assigned ${step.stepName} to ${employee.fullName}`);

            // Clear selection
            setSelectedSteps(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Failed to assign step:', error);
            alert(error.response?.data?.message || 'Failed to assign step');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Layers size={24} className="text-blue-600" />
                    Process Mapping
                </h1>
                <p className="text-sm text-slate-500 mt-1">Assign employees to manufacturing steps for items in "New" state</p>
            </div>

            {/* Items List */}
            <div className="flex-1 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="font-semibold text-slate-800">Items Awaiting Assignment ({items.length})</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Layers size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>No items in "New" state</p>
                            <p className="text-sm mt-2">Items will appear here once created with manufacturing steps</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map(item => {
                                const isExpanded = expandedItems[item._id];
                                // Include both execution AND testing steps for mapping
                                const mfgSteps = item.processes?.filter(p =>
                                    p.stepType === 'execution' || p.stepType === 'testing'
                                ) || [];
                                const assignedCount = item.assignedEmployees?.length || 0;

                                return (
                                    <div key={item._id} className="border border-slate-200 rounded-md overflow-hidden">
                                        {/* Item Header */}
                                        <div
                                            onClick={() => toggleItemExpand(item._id)}
                                            className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition flex justify-between items-center"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Code: {item.code || 'N/A'} | {mfgSteps.length} manufacturing steps
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                        {item.state}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {assignedCount} / {mfgSteps.length} steps assigned
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                        </div>

                                        {/* Manufacturing Steps */}
                                        {isExpanded && (
                                            <div className="p-4 bg-white border-t border-slate-200">
                                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Manufacturing Steps:</h4>
                                                <div className="space-y-3">
                                                    {mfgSteps.map(step => {
                                                        const assignment = item.assignedEmployees?.find(a => a.processStepId === step.id);
                                                        const key = `${item._id}-${step.id}`;
                                                        const selectedEmpId = selectedSteps[key];

                                                        return (
                                                            <div key={step.id} className="border border-slate-200 rounded-md p-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-slate-800">{step.stepName}</div>
                                                                        {step.description && (
                                                                            <div className="text-xs text-slate-500 mt-1">{step.description}</div>
                                                                        )}
                                                                    </div>
                                                                    {assignment && (
                                                                        <div className="flex items-center gap-2 text-green-600">
                                                                            <CheckCircle size={16} />
                                                                            <span className="text-sm">{assignment.employeeName}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {!assignment && (
                                                                    <div className="flex flex-col gap-3 mt-3">
                                                                        <div className="flex gap-2">
                                                                            <div className="flex-1">
                                                                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Assigned Employee</label>
                                                                                <select
                                                                                    value={selectedEmpId || ''}
                                                                                    onChange={(e) => handleEmployeeSelect(item._id, step.id, e.target.value)}
                                                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                                                                >
                                                                                    <option value="">Select Employee...</option>
                                                                                    {employees.map(emp => (
                                                                                        <option key={emp._id} value={emp._id}>
                                                                                            {emp.fullName} ({emp.employeeId})
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="w-1/3">
                                                                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Expected Completion</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={expectedDates[key] || ''}
                                                                                    onChange={(e) => handleDateChange(item._id, step.id, e.target.value)}
                                                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleAssignStep(item, step)}
                                                                            disabled={!selectedEmpId}
                                                                            className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                                                                        >
                                                                            <Save size={16} />
                                                                            Assign & Map Step
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {assignedCount === mfgSteps.length && (
                                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                                                        ✅ All steps assigned! This item will move to "Assigned" state automatically.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MappingPage;

