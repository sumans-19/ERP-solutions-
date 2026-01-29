import React, { useState, useEffect } from 'react';
import {
    FileText, CheckCircle2, ShoppingCart, ClipboardCheck, FileCheck,
    PauseCircle, Truck, ChevronRight, Play, Check, X, AlertCircle, Package, Layers
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

const OrderStageGate = () => {
    const [counts, setCounts] = useState({ New: 0, Planned: 0, Production: 0, QC: 0, Finalization: 0, Done: 0, Hold: 0 });
    const [selectedGate, setSelectedGate] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCounts();
    }, []);

    useEffect(() => {
        if (selectedGate) {
            fetchOrdersForGate(selectedGate);
        }
    }, [selectedGate]);

    const fetchCounts = async () => {
        try {
            console.log('📊 Fetching order stage counts...');
            const data = await getOrderStateCounts() || {};
            console.log('📊 Stage Data Received:', data);

            // Aggregate counts based on gates
            const aggregated = {};
            Object.entries(STAGE_CONFIG).forEach(([gate, config]) => {
                const count = config.stages.reduce((sum, s) => {
                    const val = data[s] || 0;
                    return sum + (typeof val === 'number' ? val : parseInt(val) || 0);
                }, 0);
                aggregated[gate] = count;
            });
            aggregated.Hold = data.OnHold || 0;

            console.log('📊 Aggregated Gate Counts:', aggregated);
            setCounts(aggregated);
            setLoading(false);
        } catch (error) {
            console.error('❌ Failed to fetch order counts:', error);
            setLoading(false);
        }
    };

    const fetchOrdersForGate = async (gate) => {
        try {
            setOrders([]); // Clear current list
            const stages = STAGE_CONFIG[gate]?.stages || [gate === 'Hold' ? 'OnHold' : gate];

            const allOrders = await Promise.all(stages.map(s => getOrdersByStage(s)));
            const merged = allOrders.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setOrders(merged);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading stage data...</p>
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
                                {React.createElement(selectedGate === 'Hold' ? AlertCircle : STAGE_CONFIG[selectedGate].icon, { size: 14 })}
                                {selectedGate === 'Hold' ? 'Hold' : STAGE_CONFIG[selectedGate].label} Queue ({orders.length})
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
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                            <CheckCircle2 size={48} className="opacity-10 mb-4 text-emerald-500" />
                            <p className="text-sm font-medium">This queue is empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.map(order => (
                                <div key={order._id} className="p-4 rounded-md border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{order.partyName}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1">PO: {order.poNumber || 'N/A'}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${order.orderStage === 'OnHold' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {order.orderStage}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-2">
                                                ₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50/50 p-2 rounded-md group-hover:bg-slate-50 transition-colors">
                                                <span className="font-bold text-slate-700 truncate mr-2">{item.itemName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Qty:</span>
                                                    <span className="font-black text-slate-900 bg-white px-1.5 py-0.5 rounded shadow-sm">{item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                {order.items?.length || 0}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Items</span>
                                        </div>
                                        <button
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                            title="View Details"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
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

export default OrderStageGate;

