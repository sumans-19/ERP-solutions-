import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, CheckCircle2, Wrench, ClipboardCheck, FileCheck,
    PauseCircle, Package, ChevronRight, Play, Check, X, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const STATE_CONFIG = {
    New: { color: 'blue', icon: FileText, label: 'New' },
    Assigned: { color: 'purple', icon: Package, label: 'Assigned' },
    Manufacturing: { color: 'amber', icon: Wrench, label: 'Production' },
    Verification: { color: 'cyan', icon: ClipboardCheck, label: 'Verification' },
    Documentation: { color: 'indigo', icon: FileCheck, label: 'Docs' },
    Completed: { color: 'green', icon: CheckCircle2, label: 'Done' },
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
        return <div className="flex items-center justify-center flex-1 bg-slate-50"><div className="text-slate-500 font-medium">Loading tracking data...</div></div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 p-6 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Process Management</h1>
                <p className="text-xs text-slate-500">Monitor and manage manufacturing stage-gates</p>
            </div>

            {/* State Grid - Compressed to single row on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 flex-shrink-0">
                {Object.entries(STATE_CONFIG).filter(([state]) => state !== 'Hold').map(([state, config]) => {
                    const Icon = config.icon;
                    const count = stateCounts[state] || 0;
                    const isSelected = selectedState === state;

                    return (
                        <button
                            key={state}
                            onClick={() => setSelectedState(state)}
                            className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${isSelected
                                ? `border-${config.color}-500 bg-${config.color}-50 shadow-md`
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={22} className={`text-${config.color}-600`} />
                                <span className={`text-2xl font-black text-${config.color}-600`}>{count}</span>
                            </div>
                            <div className="font-black text-slate-800 text-xs uppercase tracking-widest leading-none">{config.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Hold State - Slimmed down */}
            {stateCounts.Hold > 0 && (
                <div className="mb-6 flex-shrink-0">
                    <button
                        onClick={() => setSelectedState('Hold')}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedState === 'Hold'
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-red-100 bg-white hover:border-red-300 hover:shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <AlertCircle size={24} className="text-red-600 animate-pulse" />
                                <div>
                                    <div className="font-black text-slate-800 text-base tracking-tight uppercase">Operational Priority: Items On Hold</div>
                                    <div className="text-xs text-red-500 font-bold leading-none mt-1">Requires immediate sign-off or intervention</div>
                                </div>
                            </div>
                            <span className="text-3xl font-black text-red-600 mr-2">{stateCounts.Hold}</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Item List - Maximized Space */}
            {selectedState && (
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            {React.createElement(STATE_CONFIG[selectedState].icon, { size: 14 })}
                            {STATE_CONFIG[selectedState].label} Tracking ({items.length})
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Package size={48} className="opacity-10 mb-2" />
                                <p className="text-sm font-medium">No active items in this phase</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div
                                        key={item._id}
                                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 transition-colors bg-white shadow-xs"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                                                <p className="text-[11px] text-slate-500 font-medium">Job Ref: {item.code || 'N/A'}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter bg-${STATE_CONFIG[item.state].color}-100 text-${STATE_CONFIG[item.state].color}-700 border border-${STATE_CONFIG[item.state].color}-200`}>
                                                {item.state}
                                            </span>
                                        </div>

                                        {/* Process Steps */}
                                        {item.processes && item.processes.length > 0 && (
                                            <div className="mt-3 bg-slate-50 rounded-lg p-2 space-y-2 border border-slate-100">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Production Steps:</div>
                                                {item.processes.filter(p => p.stepType === 'execution' || p.stepType === 'testing').map(step => {
                                                    const assignment = item.assignedEmployees?.find(a => a.processStepId === step.id);
                                                    return (
                                                        <div key={step.id} className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-100 group/step">
                                                            <div className="flex items-center gap-2">
                                                                {assignment?.status === 'completed' ? (
                                                                    <div className="bg-green-500 p-0.5 rounded-full"><Check size={10} className="text-white" /></div>
                                                                ) : assignment?.status === 'in-progress' ? (
                                                                    <div className="bg-blue-500 p-0.5 rounded-full animate-pulse"><Play size={10} className="text-white" /></div>
                                                                ) : (
                                                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />
                                                                )}
                                                                <span className="text-slate-700 font-semibold">{step.stepName}</span>
                                                                {step.stepType === 'testing' && <span className="text-[8px] bg-purple-100 text-purple-600 px-1 rounded font-bold">QC</span>}
                                                                {assignment && <span className="text-slate-400 italic">({assignment.employeeName})</span>}
                                                            </div>
                                                            {assignment && assignment.status !== 'completed' && assignment.status !== 'failed' && (
                                                                <button
                                                                    onClick={() => handleCompleteStep(item._id, step.id)}
                                                                    className="px-2 py-0.5 bg-green-600 text-white rounded text-[9px] font-bold hover:bg-green-700 opacity-100"
                                                                >
                                                                    MARK DONE
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                                            {item.state === 'Verification' && (
                                                <button
                                                    onClick={() => handleCompleteVerification(item._id)}
                                                    className="flex-1 py-1.5 text-[10px] font-bold bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
                                                >
                                                    Final Approval
                                                </button>
                                            )}
                                            {item.state === 'Documentation' && (
                                                <button
                                                    onClick={() => handleCompleteDocumentation(item._id)}
                                                    className="flex-1 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                                >
                                                    Sign-off Docs
                                                </button>
                                            )}
                                            {item.state === 'Hold' ? (
                                                <div className="flex-1 flex gap-2">
                                                    <button
                                                        onClick={() => handleResumeItem(item._id)}
                                                        className="px-4 py-1.5 text-[10px] font-bold bg-green-600 text-white rounded-md hover:bg-green-700"
                                                    >
                                                        Resume
                                                    </button>
                                                    {item.holdReason && (
                                                        <span className="text-[10px] text-red-600 truncate flex-1 self-center bg-red-50 px-2 py-1 rounded">Reason: {item.holdReason}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Hold reason:');
                                                        if (reason) handleHoldItem(item._id, reason);
                                                    }}
                                                    className="px-3 py-1.5 text-[10px] font-bold text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                                                >
                                                    Hold
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
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Package size={48} className="mx-auto mb-3 text-slate-200" />
                        <h3 className="font-bold text-slate-700 text-sm">No State Selected</h3>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Choose a production phase from the grid above to investigate active items.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessManagement;
