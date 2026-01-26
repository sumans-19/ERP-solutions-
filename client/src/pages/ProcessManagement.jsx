import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, CheckCircle2, Wrench, ClipboardCheck, FileCheck,
    PauseCircle, Package, ChevronRight, Play, Check, X, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATE_CONFIG = {
    New: { color: 'blue', icon: FileText, label: 'New Items' },
    Assigned: { color: 'purple', icon: Package, label: 'Assigned' },
    Manufacturing: { color: 'amber', icon: Wrench, label: 'Manufacturing' },
    Verification: { color: 'cyan', icon: ClipboardCheck, label: 'Verification' },
    Documentation: { color: 'indigo', icon: FileCheck, label: 'Documentation' },
    Completed: { color: 'green', icon: CheckCircle2, label: 'Completed' },
    Hold: { color: 'red', icon: PauseCircle, label: 'On Hold' }
};

const ProcessManagement = () => {
    const [stateCounts, setStateCounts] = useState({});
    const [selectedState, setSelectedState] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStateCounts();
    }, []);

    useEffect(() => {
        if (selectedState) {
            fetchItemsByState(selectedState);
        }
    }, [selectedState]);

    const fetchStateCounts = async () => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            const response = await axios.get(`${API_URL}/api/items/stats/state-counts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStateCounts(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch state counts:', error);
            setLoading(false);
        }
    };

    const fetchItemsByState = async (state) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            const response = await axios.get(`${API_URL}/api/items/state/${state}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    };

    const handleCompleteStep = async (itemId, processStepId) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            await axios.post(`${API_URL}/api/items/${itemId}/complete-step`,
                { processStepId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStateCounts();
            fetchItemsByState(selectedState);
            alert('Step completed successfully!');
        } catch (error) {
            console.error('Failed to complete step:', error);
            alert('Failed to complete step');
        }
    };

    const handleHoldItem = async (itemId, reason) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            await axios.post(`${API_URL}/api/items/${itemId}/hold`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStateCounts();
            fetchItemsByState(selectedState);
            alert('Item put on hold');
        } catch (error) {
            console.error('Failed to hold item:', error);
            alert('Failed to hold item');
        }
    };

    const handleResumeItem = async (itemId) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            await axios.post(`${API_URL}/api/items/${itemId}/resume`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStateCounts();
            fetchItemsByState(selectedState);
            alert('Item resumed');
        } catch (error) {
            console.error('Failed to resume item:', error);
            alert('Failed to resume item');
        }
    };

    const handleCompleteVerification = async (itemId) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            await axios.post(`${API_URL}/api/items/${itemId}/complete-verification`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStateCounts();
            fetchItemsByState(selectedState);
            alert('Verification completed!');
        } catch (error) {
            console.error('Failed to complete verification:', error);
            alert('Failed to complete verification');
        }
    };

    const handleCompleteDocumentation = async (itemId) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            await axios.post(`${API_URL}/api/items/${itemId}/complete-documentation`,
                { remarks: 'Documentation completed' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchStateCounts();
            fetchItemsByState(selectedState);
            alert('Documentation completed!');
        } catch (error) {
            console.error('Failed to complete documentation:', error);
            alert('Failed to complete documentation');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="h-full w-full flex flex-col bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Process Management</h1>
                <p className="text-sm text-slate-500 mt-1">Track items through manufacturing lifecycle</p>
            </div>

            {/* State Boxes Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {Object.entries(STATE_CONFIG).filter(([state]) => state !== 'Hold').map(([state, config]) => {
                    const Icon = config.icon;
                    const count = stateCounts[state] || 0;
                    const isSelected = selectedState === state;

                    return (
                        <button
                            key={state}
                            onClick={() => setSelectedState(state)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                ? `border-${config.color}-500 bg-${config.color}-50 shadow-md`
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={24} className={`text-${config.color}-600`} />
                                <span className={`text-3xl font-bold text-${config.color}-600`}>{count}</span>
                            </div>
                            <div className="font-semibold text-slate-700">{config.label}</div>
                            <div className="text-xs text-slate-500 mt-1">Click to view items</div>
                        </button>
                    );
                })}
            </div>

            {/* Hold State - Full Width */}
            {stateCounts.Hold > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setSelectedState('Hold')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedState === 'Hold'
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-red-200 bg-white hover:border-red-300 hover:shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={24} className="text-red-600" />
                                <div>
                                    <div className="font-semibold text-slate-700">Items On Hold</div>
                                    <div className="text-xs text-slate-500">Requires attention</div>
                                </div>
                            </div>
                            <span className="text-3xl font-bold text-red-600">{stateCounts.Hold}</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Item List */}
            {selectedState && (
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            {React.createElement(STATE_CONFIG[selectedState].icon, { size: 18 })}
                            {STATE_CONFIG[selectedState].label} ({items.length})
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No items in this state
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div
                                        key={item._id}
                                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                                <p className="text-sm text-slate-500">Code: {item.code || 'N/A'}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${STATE_CONFIG[item.state].color}-100 text-${STATE_CONFIG[item.state].color}-700`}>
                                                {item.state}
                                            </span>
                                        </div>

                                        {/* Manufacturing & Testing Steps */}
                                        {item.processes && item.processes.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <div className="text-xs font-medium text-slate-600 mb-2">Process Steps:</div>
                                                {item.processes.filter(p => p.stepType === 'execution' || p.stepType === 'testing').map(step => {
                                                    const assignment = item.assignedEmployees?.find(a => a.processStepId === step.id);
                                                    return (
                                                        <div key={step.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                                                            <div className="flex items-center gap-2">
                                                                {assignment?.status === 'completed' ? (
                                                                    <Check size={16} className="text-green-600" />
                                                                ) : assignment?.status === 'in-progress' ? (
                                                                    <Play size={16} className="text-blue-600" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                                                )}
                                                                <span className="text-slate-700">{step.stepName}</span>
                                                                {step.stepType === 'testing' && (
                                                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Test</span>
                                                                )}
                                                                {assignment && (
                                                                    <span className="text-xs text-slate-500">({assignment.employeeName})</span>
                                                                )}
                                                            </div>
                                                            {assignment && assignment.status !== 'completed' && assignment.status !== 'failed' && (
                                                                <button
                                                                    onClick={() => handleCompleteStep(item._id, step.id)}
                                                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                                >
                                                                    Complete
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-3 flex gap-2">
                                            {item.state === 'Verification' && (
                                                <button
                                                    onClick={() => handleCompleteVerification(item._id)}
                                                    className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700"
                                                >
                                                    Pass Verification
                                                </button>
                                            )}
                                            {item.state === 'Documentation' && (
                                                <button
                                                    onClick={() => handleCompleteDocumentation(item._id)}
                                                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                >
                                                    Complete Documentation
                                                </button>
                                            )}
                                            {item.state === 'Hold' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleResumeItem(item._id)}
                                                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        Resume
                                                    </button>
                                                    {item.holdReason && (
                                                        <span className="text-xs text-red-600 self-center">Reason: {item.holdReason}</span>
                                                    )}
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Enter hold reason:');
                                                        if (reason) handleHoldItem(item._id, reason);
                                                    }}
                                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    Put on Hold
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedState && (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Package size={64} className="mx-auto mb-4 text-slate-300" />
                        <p>Select a state to view items</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessManagement;
