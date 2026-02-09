import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronDown, Building2, Package, ShoppingCart,
    Layers, User, CheckCircle2, Clock, AlertCircle, PlayCircle
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const OrderTreeView = () => {
    const [treeData, setTreeData] = useState([]);
    const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0, onHold: 0 });
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';

    useEffect(() => {
        fetchTreeData();
    }, []);

    const fetchTreeData = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get(`${API_URL}/api/orders/tree-view`, {
                headers: {
                    'x-user-role': user?.role,
                    'x-user-id': user?._id
                }
            });
            const data = response.data || [];
            setTreeData(data);

            // Calculate Stats from Tree Data
            let total = 0, processing = 0, completed = 0, onHold = 0;
            data.forEach(company => {
                company.orders?.forEach(order => {
                    total++;
                    if (order.stage === 'Completed') completed++;
                    else if (order.stage === 'OnHold') onHold++;
                    else processing++;
                });
            });
            setStats({ total, processing, completed, onHold });

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch tree data', error);
            setError("Failed to load data. Please try again.");
            setLoading(false);
        }
    };

    const toggleNode = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'passed':
            case 'mfgcompleted':
                return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'inprogress':
            case 'processing':
                return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'onhold':
                return 'text-rose-500 bg-rose-50 border-rose-100';
            default:
                return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const TreeNode = ({ node, level = 0 }) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = (node.orders || node.items || node.jobs || node.steps);

        let label = node.name || node.poNumber || node.itemName || node.stepName;
        if (node.type === 'job') {
            label = `Batch: ${node.quantity} • Steps: ${node.steps?.length || 0} • Ref: ${node.jobNumber}`;
        }

        return (
            <div className="select-none relative">
                <div
                    onClick={() => hasChildren && toggleNode(node.id)}
                    className={`flex items-center gap-3 p-3 rounded-md transition-all cursor-pointer relative ${level === 0 ? 'bg-white border border-slate-200 mb-2 shadow-sm' :
                        'hover:bg-slate-50 mb-1'
                        }`}
                >
                    {hasChildren ? (
                        <div className="text-slate-400">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                    ) : (
                        <div className="w-[18px]" />
                    )}

                    <div className="flex items-center gap-3 flex-1">
                        {node.type === 'company' && <Building2 className="text-blue-600" size={20} />}
                        {node.type === 'order' && <ShoppingCart className="text-indigo-600" size={18} />}
                        {node.type === 'item' && <Package className="text-amber-600" size={16} />}
                        {node.type === 'job' && <Layers className="text-purple-600" size={14} />}

                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <span className={`font-bold text-slate-900 ${node.type === 'company' ? 'text-lg' :
                                    node.type === 'order' ? 'text-base' : 'text-sm'
                                    }`}>
                                    {label}
                                </span>

                                {node.stage && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                                        {node.stage}
                                    </span>
                                )}

                                {node.status && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(node.status)}`}>
                                        {node.status}
                                    </span>
                                )}

                                {node.progress !== undefined && (
                                    <div className="flex items-center gap-2 flex-1 max-w-[100px]">
                                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${node.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{node.progress}%</span>
                                    </div>
                                )}
                            </div>

                            {node.type === 'order' && (
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                    PO DATE: {new Date(node.date).toLocaleDateString()}
                                </p>
                            )}
                            {node.type === 'item' && (
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                    PART: {node.partNo} • QTY: {node.quantity} • ETD: {new Date(node.deliveryDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden ml-6 pl-6"
                        >
                            {node.orders?.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
                            {node.items?.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
                            {node.jobs?.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
                            {node.steps?.map((step, idx) => (
                                <div key={idx} className="relative p-2 mb-1 flex items-center justify-between bg-slate-50/50 rounded-md border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shadow-sm border border-blue-200 min-w-[50px]">
                                            Step {idx + 1}
                                        </div>
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700">{step.stepName}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(step.status)}`}>
                                            {step.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-slate-400" />
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            Assignee: {
                                                typeof step.employeeId === 'object' ? (step.employeeId?.fullName || 'Unassigned') :
                                                    (typeof step.employeeId === 'string' && step.employeeId.length > 5 ? 'ID: ' + step.employeeId : 'Unassigned')
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (loading) return (
        <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold animate-pulse">Building Production Hierarchy...</p>
        </div>
    );

    return (
        <div className="p-6 bg-white rounded-md shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers size={24} className="text-blue-600" />
                        Production Hierarchy
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Real-time status tracking across batches and processes</p>
                </div>
                <div className="flex items-center gap-6 mr-10">
                    <div className="text-center">
                        <div className="text-lg font-black text-slate-900 leading-none">{stats.total}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Orders</div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="text-center">
                        <div className="text-lg font-black text-blue-600 leading-none">{stats.processing}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Active</div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="text-center">
                        <div className="text-lg font-black text-emerald-500 leading-none">{stats.completed}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ready</div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="text-center">
                        <div className="text-lg font-black text-rose-500 leading-none">{stats.onHold}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hold</div>
                    </div>
                </div>
                <button
                    onClick={fetchTreeData}
                    className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-400"
                    title="Refresh Data"
                >
                    <PlayCircle size={20} />
                </button>
            </div>

            <div className="space-y-4">
                {treeData.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic">
                        {error ? <span className="text-red-500">{error}</span> : "No active production trees found. Check if orders exist."}
                    </div>
                ) : (
                    treeData.map(company => (
                        <TreeNode key={company.id} node={company} />
                    ))
                )}
            </div>
        </div>
    );
};

export default OrderTreeView;

