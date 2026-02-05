import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText, CheckCircle2, ShoppingCart, ClipboardCheck, FileCheck,
    PauseCircle, Truck, ChevronRight, Play, Check, X, AlertCircle, Package, Layers, Calendar
} from 'lucide-react';
import {
    getOrderStateCounts,
    getOrdersByStage
} from '../../services/api';

const STAGE_CONFIG = {
    New: { color: 'blue', icon: FileText, label: 'New', stages: ['New'] },
    Planned: { color: 'purple', icon: Layers, label: 'Ready', stages: ['Mapped', 'Assigned'] },
    Production: { color: 'amber', icon: ShoppingCart, label: 'Production', stages: ['Processing'] },
    QC: { color: 'cyan', icon: ClipboardCheck, label: 'QC/Verification', stages: ['MFGCompleted', 'FQC'] },
    Finalization: { color: 'indigo', icon: FileCheck, label: 'Docs/Packing', stages: ['Documentation', 'Packing', 'Dispatch'] },
    Done: { color: 'green', icon: CheckCircle2, label: 'Finished', stages: ['Completed'] }
};

const COLOR_MAP = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', darkText: 'text-blue-700', deepText: 'text-blue-800' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', darkText: 'text-purple-700', deepText: 'text-purple-800' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', darkText: 'text-amber-700', deepText: 'text-amber-800' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600', darkText: 'text-cyan-700', deepText: 'text-cyan-800' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', darkText: 'text-indigo-700', deepText: 'text-indigo-800' },
    green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600', darkText: 'text-green-700', deepText: 'text-green-800' }
};

// Global throttle to prevent loop
let lastFetchTimestamp = 0;

const OrderStageGate = () => {
    const [counts, setCounts] = useState({ New: 0, Planned: 0, Production: 0, QC: 0, Finalization: 0, Done: 0, Hold: 0 });
    const [selectedGate, setSelectedGate] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrdersForGate = useCallback(async (gate) => {
        if (!gate) return;
        try {
            console.log(`📦 Fetching orders for gate: ${gate}`);
            const stages = STAGE_CONFIG[gate]?.stages || [gate === 'Hold' ? 'OnHold' : gate];

            const allOrders = await Promise.all(stages.map(async s => {
                try {
                    const res = await getOrdersByStage(s);
                    return Array.isArray(res) ? res : res?.data || [];
                } catch (err) {
                    console.error(`Failed to fetch stage ${s}:`, err);
                    return [];
                }
            }));

            const merged = allOrders.flat().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            console.log(`✅ Merged ${merged.length} orders for ${gate}`);
            setOrders(merged);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    }, []);

    let lastFetch = 0;

    const fetchCounts = useCallback(async () => {
        const now = Date.now();
        if (now - lastFetch < 2000) { // Throttle 2s
            return;
        }
        lastFetch = now;

        try {
            setLoading(true);
            console.log('📊 Fetching order stage counts...');
            const data = await getOrderStateCounts() || {};
            const stats = data.data || data; // Handle possible wrapped response

            // Aggregate counts based on gates
            const aggregated = {};
            Object.entries(STAGE_CONFIG).forEach(([gate, config]) => {
                const count = config.stages.reduce((sum, s) => {
                    const val = stats[s] || 0;
                    return sum + (typeof val === 'number' ? val : parseInt(val) || 0);
                }, 0);
                aggregated[gate] = count;
            });
            aggregated.Hold = (stats.OnHold || 0);

            console.log('📊 Aggregated Gate Counts:', aggregated);
            setCounts(aggregated);

            // Auto-select logic
            setSelectedGate(prev => {
                if (prev) return prev; // Keep current selection if any
                const firstActive = Object.keys(STAGE_CONFIG).find(g => aggregated[g] > 0);
                return firstActive || (aggregated.Hold > 0 ? 'Hold' : null);
            });

            setLoading(false);
        } catch (error) {
            console.error('❌ Failed to fetch order counts:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    useEffect(() => {
        if (selectedGate) {
            fetchOrdersForGate(selectedGate);
        }
    }, [selectedGate, fetchOrdersForGate]);

    if (loading && Object.values(counts).every(c => c === 0)) {
        return (
            <div className="p-10 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Workflow Data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Gate Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(STAGE_CONFIG).map(([gate, config]) => {
                    const Icon = config.icon;
                    const count = counts[gate] || 0;
                    const isSelected = selectedGate === gate;
                    const colors = COLOR_MAP[config.color];

                    return (
                        <button
                            key={gate}
                            onClick={() => setSelectedGate(gate)}
                            className={`p-5 rounded-md border-2 transition-all text-left flex flex-col justify-between h-32 ${isSelected
                                ? `${colors.border} ${colors.bg} shadow-md transform scale-[1.02]`
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <Icon size={24} className={isSelected ? colors.text : 'text-slate-400'} />
                                <span className={`text-2xl font-black ${isSelected ? colors.darkText : 'text-slate-300'}`}>{count}</span>
                            </div>
                            <div className={`font-black text-[10px] uppercase tracking-widest leading-none ${isSelected ? colors.deepText : 'text-slate-500'}`}>
                                {config.label}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Hold Alert Box */}
            {counts.Hold > 0 && (
                <button
                    onClick={() => setSelectedGate('Hold')}
                    className={`w-full p-4 rounded-md border-2 transition-all text-left flex items-center justify-between ${selectedGate === 'Hold'
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : 'border-red-100 bg-white hover:border-red-200'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertCircle size={20} className="text-red-600 animate-pulse" />
                        </div>
                        <div>
                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight">Orders On Hold</div>
                            <div className="text-[10px] text-red-500 font-bold leading-none mt-1">Found {counts.Hold} orders requiring administrative action</div>
                        </div>
                    </div>
                    <span className="text-2xl font-black text-red-600 mr-2">{counts.Hold}</span>
                </button>
            )}

            {/* List Section */}
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        {selectedGate ? (
                            <>
                                {React.createElement(selectedGate === 'Hold' ? AlertCircle : STAGE_CONFIG[selectedGate]?.icon || Package, { size: 14 })}
                                {selectedGate === 'Hold' ? 'Hold' : STAGE_CONFIG[selectedGate]?.label || 'Selected'} Queue ({orders.length})
                            </>
                        ) : (
                            'Select a stage to view orders'
                        )}
                    </h2>
                </div>

                <div className="flex-1 p-6">
                    {!selectedGate ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                            <Package size={48} className="opacity-10 mb-4" />
                            <p className="text-sm font-medium">Choose a workflow phase above to see detailed orders</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} className="opacity-20 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">This queue is empty</p>
                            <p className="text-[10px] text-slate-400 mt-1">All orders have been processed or moved to the next phase.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {orders.map(order => (
                                <div key={order._id} className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group relative">
                                    {/* Accent Background Glow Wrapper */}
                                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${order.orderStage === 'OnHold' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                        {/* Left Section: Identity */}
                                        <div className="flex-1 min-w-[280px]">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-lg tracking-tight">{order.partyName}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.orderStage === 'OnHold' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {order.orderStage || 'NEW'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                                    <FileText size={12} />
                                                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono text-slate-600">{order.poNumber || 'PO: NOT SET'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                                    <Calendar size={12} />
                                                    <span>{formatDate(order.poDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle Section: Items Snapshot */}
                                        <div className="flex-[2] flex flex-wrap gap-2 items-center min-w-[300px]">
                                            {(order.items || []).slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-white group-hover:border-blue-100 transition-colors">
                                                    <span className="font-bold text-slate-700 text-[11px] max-w-[150px] truncate">{item.itemName}</span>
                                                    <span className="w-px h-3 bg-slate-200"></span>
                                                    <span className="font-black text-blue-600 text-[11px]">{item.quantity}</span>
                                                </div>
                                            ))}
                                            {(order.items || []).length > 3 && (
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    + {order.items.length - 3} More items
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Section: Status & Action */}
                                        <div className="flex items-center gap-8 min-w-[200px] justify-between lg:justify-end">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                                                <div className="text-lg font-black text-slate-900 font-mono">
                                                    ₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <button
                                                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-600 shadow-sm transition-all duration-300"
                                                title="View Details"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Decoration */}
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Status: Stable</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority: {order.priority || 'Normal'}</span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-3">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                        <span className="text-[8px] font-bold text-slate-400">U{i}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">MODIFIED {formatDate(order.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return '-';
    }
};

export default OrderStageGate;
