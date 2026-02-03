import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Package,
    Factory,
    CheckCircle2,
    Search,
    Filter,
    AlertTriangle,
    Calendar,
    Clock,
    Plus,
    X,
    FileText,
    Truck,
    Settings,
    Trash2,
    Edit2,
    ArrowRight,
    Eye,
    RefreshCcw,
    Database,
    ChevronDown,
    ChevronUp,
    ChevronRight
} from 'lucide-react';

const COMMON_UOMS = [
    'kg', 'meters', 'liters', 'SqMtr', 'pcs', 'rolls', 'sets', 'boxes', 'packets', 'sheets'
];
import {
    getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial,
    getMaterialRequests, createMaterialRequest, updateMaterialRequest, deleteMaterialRequest, getNextMRNumber,
    getGRNs, createGRN, updateGRN, deleteGRN, getNextGRNNumber,
    getWIPStock, createWIPStock, updateWIPStock, deleteWIPStock,
    getFinishedGoods, createFinishedGood, updateFinishedGood, deleteFinishedGood,
    getRejectedGoods, createRejectedGood, updateRejectedGood, deleteRejectedGood,
    recalculateRMStock,
    getAllParties
} from '../services/api';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('material-request');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Data states
    const [rawMaterials, setRawMaterials] = useState([]);
    const [materialRequests, setMaterialRequests] = useState([]);
    const [grns, setGrns] = useState([]);
    const [wipStock, setWipStock] = useState([]);
    const [finishedGoods, setFinishedGoods] = useState([]);
    const [rejectedGoods, setRejectedGoods] = useState([]);
    const [inventoryLogs, setInventoryLogs] = useState([]);
    const [selectedRMDetails, setSelectedRMDetails] = useState(null);
    const [parties, setParties] = useState([]);

    // Centralized Notification & Remark State
    const [alert, setAlert] = useState(null); // { type, message }
    const [remarkModal, setRemarkModal] = useState(null); // { type, action, id, data }

    const showAlert = (message, type = 'success') => {
        setAlert({ message, type });
        // Auto-close after 3 seconds for success
        if (type === 'success') {
            setTimeout(() => setAlert(null), 3000);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            switch (activeTab) {
                case 'raw-materials':
                    const rm = await getRawMaterials();
                    setRawMaterials(rm || []);
                    break;
                case 'material-request':
                    const mr = await getMaterialRequests();
                    setMaterialRequests(mr || []);
                    break;
                case 'grn':
                    const g = await getGRNs();
                    setGrns(g || []);
                    const rmList = await getRawMaterials();
                    setRawMaterials(rmList || []);
                    const partyList = await getAllParties();
                    setParties(partyList || []);
                    break;
                case 'wip':
                    const wip = await getWIPStock();
                    setWipStock(wip || []);
                    break;
                case 'finished':
                    const fg = await getFinishedGoods();
                    setFinishedGoods(fg || []);
                    break;
                case 'rejected':
                    const rej = await getRejectedGoods();
                    setRejectedGoods(rej || []);
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async (data) => {
        // Client-side duplicate check for new items
        if (!editingItem && activeTab === 'raw-materials') {
            const exists = rawMaterials.some(rm => rm.code === data.code);
            if (exists) {
                showAlert(`Error: Item Code "${data.code}" already exists in the master list. Please use a unique code.`, 'error');
                return;
            }
        }

        try {
            if (editingItem) {
                // Clean data of metadata that might cause Mongoose errors
                const { _id, createdAt, updatedAt, __v, ...cleanData } = data;

                switch (activeTab) {
                    case 'raw-materials': await updateRawMaterial(editingItem._id, cleanData); break;
                    case 'material-request': await updateMaterialRequest(editingItem._id, cleanData); break;
                    case 'grn': await updateGRN(editingItem._id, cleanData); break;
                    case 'wip': await updateWIPStock(editingItem._id, cleanData); break;
                    case 'finished': await updateFinishedGood(editingItem._id, cleanData); break;
                    case 'rejected': await updateRejectedGood(editingItem._id, cleanData); break;
                }
            } else {
                switch (activeTab) {
                    case 'raw-materials': await createRawMaterial(data); break;
                    case 'material-request': await createMaterialRequest(data); break;
                    case 'grn': await createGRN(data); break;
                    case 'wip': await createWIPStock(data); break;
                    case 'finished': await createFinishedGood(data); break;
                    case 'rejected': await createRejectedGood(data); break;
                }
            }
            setIsAddModalOpen(false);
            setEditingItem(null);
            await fetchData();
            showAlert("✓ Success: Saved successfully!");
        } catch (error) {
            console.error("Operation failed", error);
            const errMsg = error.response?.data?.message || "Failed to save. Please try again.";
            showAlert(errMsg, "error");
        }
    };

    const handleDelete = async (id) => {
        setRemarkModal({
            action: 'Delete',
            onConfirm: async (remark) => {
                try {
                    if (activeTab === 'raw-materials') {
                        await deleteRawMaterial(id, { remark });
                    } else if (activeTab === 'grn') {
                        await deleteGRN(id, remark);
                    } else if (activeTab === 'material-request') {
                        await deleteMaterialRequest(id, remark);
                    } else if (activeTab === 'wip') {
                        await deleteWIPStock(id, remark);
                    } else if (activeTab === 'finished') {
                        await deleteFinishedGood(id, remark);
                    } else if (activeTab === 'rejected') {
                        await deleteRejectedGood(id, remark);
                    }
                    showAlert("Item deleted successfully!");
                    fetchData();
                } catch (error) {
                    console.error("Delete failed", error);
                    showAlert(error.response?.data?.message || "Delete failed", "error");
                }
            }
        });
    };

    const handleSyncStock = async () => {
        try {
            setLoading(true);
            await recalculateRMStock();
            await fetchData();
            showAlert("Stock levels synchronized with GRNs successfully!");
        } catch (error) {
            console.error("Sync failed", error);
            showAlert("Failed to sync stock.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleMRStatusUpdate = async (mrId, status) => {
        setRemarkModal({
            action: 'Status Change',
            onConfirm: async (remark) => {
                try {
                    const userData = JSON.parse(localStorage.getItem('user'));
                    await axios.patch(`/api/material-requests/${mrId}/status`, {
                        status,
                        remark,
                        updatedBy: userData.name || userData.username
                    });
                    showAlert(`MR ${status} successfully!`);
                    fetchData();
                } catch (error) {
                    console.error("Status update failed", error);
                    showAlert(error.response?.data?.message || "Status update failed", "error");
                }
            }
        });
    };

    // Tab configuration
    const tabs = [
        {
            id: 'material-request',
            label: 'Material Request',
            icon: FileText,
            style: {
                activeBg: 'bg-purple-100',
                activeText: 'text-purple-600',
                indicator: 'bg-purple-500'
            }
        },
        {
            id: 'grn',
            label: 'GRN',
            icon: Truck,
            style: {
                activeBg: 'bg-orange-100',
                activeText: 'text-orange-600',
                indicator: 'bg-orange-500'
            }
        },
        {
            id: 'raw-materials',
            label: 'Raw Materials',
            icon: Package,
            style: {
                activeBg: 'bg-blue-100',
                activeText: 'text-blue-600',
                indicator: 'bg-blue-500'
            }
        },
        {
            id: 'wip',
            label: 'WIP',
            icon: Factory,
            style: {
                activeBg: 'bg-amber-100',
                activeText: 'text-amber-600',
                indicator: 'bg-amber-500'
            }
        },
        {
            id: 'finished',
            label: 'Finished Goods',
            icon: CheckCircle2,
            style: {
                activeBg: 'bg-emerald-100',
                activeText: 'text-emerald-600',
                indicator: 'bg-emerald-500'
            }
        },
        {
            id: 'rejected',
            label: 'Rejected Goods',
            icon: AlertTriangle,
            style: {
                activeBg: 'bg-red-100',
                activeText: 'text-red-600',
                indicator: 'bg-red-500'
            }
        }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                        </div>
                        <p className="text-slate-500 font-medium tracking-tight">Comprehensive material tracking and control</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSyncStock}
                            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md font-bold transition-colors border border-indigo-200"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                            <span>Sync All stock</span>
                        </button>

                        {activeTab !== 'wip' && activeTab !== 'finished' && (
                            <button
                                onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                <span>Add {tabs.find(t => t.id === activeTab)?.label}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-2 px-6 py-4 transition-all duration-300 whitespace-nowrap
                                    ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                <div className={`p-2 rounded-md ${isActive ? `${tab.style.activeBg} ${tab.style.activeText}` : 'bg-slate-100'}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="text-sm">{tab.label}</span>
                                {isActive && (
                                    <motion.div layoutId="activeTabIndicator" className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.style.indicator}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'raw-materials' && (
                                <RawMaterialView
                                    data={rawMaterials}
                                    onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
                                    onDelete={handleDelete}
                                    onSelect={setSelectedRMDetails}
                                />
                            )}
                            {activeTab === 'material-request' && (
                                <MaterialRequestView
                                    data={materialRequests}
                                    onStatusUpdate={handleMRStatusUpdate}
                                    onEdit={mr => { setEditingItem(mr); setIsAddModalOpen(true); }}
                                    onDelete={handleDelete}
                                />
                            )}
                            {activeTab === 'grn' && (
                                <GRNView
                                    data={grns}
                                    onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
                                    onDelete={handleDelete}
                                />
                            )}
                            {activeTab === 'wip' && <WIPView data={wipStock} onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }} onDelete={handleDelete} />}
                            {activeTab === 'finished' && <FinishedGoodsView data={finishedGoods} onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }} onDelete={handleDelete} />}
                            {activeTab === 'rejected' && <RejectedGoodsView data={rejectedGoods} onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }} onDelete={handleDelete} />}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <InventoryModal
                        type={activeTab}
                        item={editingItem}
                        rawMaterialsList={rawMaterials}
                        partiesList={parties}
                        onClose={() => setIsAddModalOpen(false)}
                        onSubmit={handleAddOrEdit}
                    />
                )}
            </AnimatePresence>

            {/* Centralized Centered Alert */}
            <AnimatePresence>
                {alert && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className={`
                                pointer-events-auto px-8 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-4 min-w-[300px]
                                ${alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-emerald-100 text-emerald-800'}
                            `}
                        >
                            <div className={`p-2 rounded-full ${alert.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                {alert.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold uppercase text-xs tracking-widest mb-0.5">{alert.type === 'error' ? 'Error' : 'Success'}</h4>
                                <p className="font-medium">{alert.message}</p>
                            </div>
                            {alert.type === 'error' && (
                                <button onClick={() => setAlert(null)} className="p-1 hover:bg-red-100 rounded-full transition">
                                    <X size={18} />
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Center Remark Modal for Deletes/Adjustments */}
            <AnimatePresence>
                {remarkModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <Trash2 size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Mandatory Remark</h3>
                                </div>
                                <button onClick={() => setRemarkModal(null)} className="text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
                            </div>
                            <div className="p-8">
                                <p className="text-slate-600 mb-6 font-medium">Please provide a reason or remark for this action. This will be logged for audit purposes.</p>
                                <textarea
                                    autoFocus
                                    className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-0 transition-all outline-none text-slate-700 font-medium"
                                    rows="4"
                                    placeholder="Enter your remark here..."
                                    value={remarkModal.remark || ''}
                                    onChange={(e) => setRemarkModal({ ...remarkModal, remark: e.target.value })}
                                />
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button onClick={() => setRemarkModal(null)} className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-white transition text-slate-600 font-bold">Cancel</button>
                                <button
                                    disabled={!remarkModal.remark?.trim()}
                                    onClick={() => {
                                        remarkModal.onConfirm(remarkModal.remark);
                                        setRemarkModal(null);
                                    }}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    Confirm Action
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- View Components ---

const RMLineItem = ({ item, onEdit, onDelete, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [grnHistory, setGrnHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleExpand = async (e) => {
        e.stopPropagation();
        const nextState = !isExpanded;
        setIsExpanded(nextState);

        if (nextState && grnHistory.length === 0) {
            try {
                setLoading(true);
                const response = await axios.get(`/api/raw-materials/${item.code}/grn-history`);
                setGrnHistory(response.data);
            } catch (err) {
                console.error("Failed to fetch batch info", err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <tr className={`hover:bg-blue-50/30 transition-colors group ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                <td className="px-6 py-4 cursor-pointer" onClick={toggleExpand}>
                    <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                        <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700">{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.code}</div>
                            {item.hsn && <div className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-tight">HSN: {item.hsn} | GST: {item.gstRate || 0}%</div>}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 cursor-pointer" onClick={toggleExpand}>
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{item.category || 'Uncategorized'}</span>
                </td>
                <td className="px-6 py-4 text-right cursor-pointer" onClick={toggleExpand}>
                    <span className={`font-black text-lg ${item.qty > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{item.qty}</span>
                </td>
                <td className="px-6 py-4 cursor-pointer" onClick={toggleExpand}>
                    <span className="text-slate-500 font-bold">{item.uom}</span>
                </td>
                <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => onSelect(item)} title="View History Modal" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"><Eye size={16} /></button>
                        <button onClick={() => onEdit(item)} title="Edit Details" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(item._id)} title="Delete RM" className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={16} /></button>
                    </div>
                </td>
            </tr>
            <AnimatePresence>
                {isExpanded && (
                    <tr>
                        <td colSpan="5" className="px-6 py-0 bg-blue-50/20">
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 pl-10 pr-6 border-l-4 border-blue-400 my-2">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Database size={12} /> Batch Breakdown (Current Receipts)
                                    </h4>
                                    {loading ? (
                                        <div className="flex items-center gap-2 text-slate-400 py-2">
                                            <RefreshCcw size={14} className="animate-spin" />
                                            <span className="text-xs font-bold uppercase">Loading batch data...</span>
                                        </div>
                                    ) : grnHistory.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {grnHistory.map((grn) => {
                                                const grnItem = grn.items.find(i =>
                                                    i.itemCode?.trim().toUpperCase() === item.code?.trim().toUpperCase()
                                                );
                                                return (
                                                    <div key={grn._id} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm flex flex-row items-center justify-between gap-4 hover:border-blue-300 transition-all">
                                                        <div className="flex-1">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">GRN NUMBER / BATCH</div>
                                                            <div className="font-bold text-blue-700 text-sm">
                                                                {grn.grnNumber}
                                                                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{grnItem?.batchCode || 'No Batch'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 border-l border-slate-100 pl-4 hidden md:block">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Received Date</div>
                                                            <div className="text-xs font-bold text-slate-700">{new Date(grn.receivedDate).toLocaleDateString()}</div>
                                                        </div>

                                                        <div className="flex-1 border-l border-slate-100 pl-4 hidden lg:block">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">MFG / EXP</div>
                                                            <div className="text-[10px] font-bold text-slate-500">
                                                                {grnItem?.mfgDate ? new Date(grnItem.mfgDate).toLocaleDateString() : '-'} /
                                                                <span className="text-red-500">{grnItem?.expDate ? new Date(grnItem.expDate).toLocaleDateString() : '-'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="w-32 text-right bg-blue-50/50 p-2 rounded-md">
                                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Stock Qty</div>
                                                            <div className="font-black text-blue-900 text-base">{grnItem?.qty} <span className="text-[10px] font-normal text-slate-400 uppercase">{item.uom}</span></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-slate-400 italic text-xs">No active batches or GRN history found for this item.</div>
                                    )}
                                </div>
                            </motion.div>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
};

const RawMaterialView = ({ data, onEdit, onDelete, onSelect }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Code & Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Current Stock Qty</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">UOM</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((item) => (
                    <RMLineItem
                        key={item._id}
                        item={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSelect={onSelect}
                    />
                ))}
            </tbody>
        </table>
    </div>
);

const RMDetailsModal = ({ item, onClose }) => {
    const [grnHistory, setGrnHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`/api/raw-materials/${item.code}/grn-history`);
                setGrnHistory(response.data);
            } catch (err) {
                console.error("Failed to fetch GRN history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [item.code]);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">{item.code}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Stock Details & Goods Receipt History</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-slate-200"><X size={20} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Available Quantity</p>
                            <p className="text-3xl font-black text-blue-700">{item.qty} <span className="text-sm font-bold text-blue-400 uppercase">{item.uom}</span></p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-xl font-bold text-slate-700">{item.category || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">HSN Code</p>
                            <p className="text-xl font-bold text-slate-700">{item.hsn || 'N/A'}</p>
                        </div>
                    </div>

                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Truck size={16} className="text-blue-500" /> Linked GRN History
                    </h3>

                    {loading ? (
                        <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : grnHistory.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-[12px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 font-black text-slate-500 uppercase">GRN No</th>
                                        <th className="px-6 py-4 font-black text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-4 font-black text-slate-500 uppercase">Supplier</th>
                                        <th className="px-6 py-4 font-black text-slate-500 uppercase text-right">Received Qty</th>
                                        <th className="px-6 py-4 font-black text-slate-500 uppercase">Batch / Mfg / Exp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {grnHistory.map((grn) => {
                                        const grnItem = grn.items.find(i =>
                                            i.itemCode?.trim().toUpperCase() === item.code?.trim().toUpperCase()
                                        );
                                        return (
                                            <tr key={grn._id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-bold text-blue-600">{grn.grnNumber}</td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(grn.receivedDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-medium text-slate-700">{grn.supplierName}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">{grnItem?.qty}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] space-y-0.5">
                                                        <div className="font-bold text-indigo-600">B: {grnItem?.batchCode || 'N/A'}</div>
                                                        <div className="text-slate-400">M: {grnItem?.mfgDate ? new Date(grnItem.mfgDate).toLocaleDateString() : '-'}</div>
                                                        <div className="text-slate-400">E: {grnItem?.expDate ? new Date(grnItem.expDate).toLocaleDateString() : '-'}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No receipt history found for this material.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const MaterialRequestView = ({ data, onStatusUpdate, onEdit, onDelete }) => (
    <div className="space-y-6">
        {data.map((mr) => (
            <div key={mr._id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden text-[13px]">
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">{mr.mrNo}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={14} /> {new Date(mr.requestDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${mr.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                            mr.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                mr.status === 'On Hold' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                    'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                            {mr.status}
                        </span>

                        <div className="flex gap-2">
                            {mr.status !== 'Approved' && (
                                <button
                                    onClick={() => onStatusUpdate(mr._id, 'Approved')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition shadow-sm"
                                >
                                    Approve
                                </button>
                            )}
                            {mr.status !== 'On Hold' && (
                                <button
                                    onClick={() => onStatusUpdate(mr._id, 'On Hold')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition shadow-sm"
                                >
                                    Hold
                                </button>
                            )}
                            {mr.status !== 'Rejected' && (
                                <button
                                    onClick={() => onStatusUpdate(mr._id, 'Rejected')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition shadow-sm"
                                >
                                    Reject
                                </button>
                            )}
                            {mr.status !== 'Pending' && (
                                <button
                                    onClick={() => onStatusUpdate(mr._id, 'Pending')}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition shadow-sm"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>

                        <button onClick={() => onEdit(mr)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition ml-2" title="Edit MR">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(mr._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition ml-1" title="Delete MR">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-0">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-3 font-semibold text-slate-600">Item Details</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Specifications</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Type & Size</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-right">Qty & UOM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(mr.items || []).map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{item.itemName}</div>
                                        <div className="text-xs text-slate-500">Code: {item.itemCode || 'N/A'}</div>
                                        {item.description && <div className="text-xs text-slate-400 mt-1 italic">{item.description}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-700 text-xs">
                                            <span className="text-slate-400">Thick:</span> {item.thickness || '-'}<br />
                                            <span className="text-slate-400">Finish:</span> {item.finish || '-'}<br />
                                            <span className="text-slate-400">Color:</span> {item.colour || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="text-slate-700 font-medium">{item.type || 'N/A'}</div>
                                        <div className="text-slate-500 mt-1">{item.size || 'N/A'}</div>
                                        {item.expDate && <div className="text-red-500 mt-1">Exp: {new Date(item.expDate).toLocaleDateString()}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-lg font-black text-blue-700">{item.qty}</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase">{item.uom}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
    </div>
);

const GRNView = ({ data, onEdit, onDelete }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">GRN No & Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Supplier & PO</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">IQC & Transport</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Items Detail</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((grn) => (
                    <tr key={grn._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{grn.grnNumber}</div>
                            <div className="text-xs text-slate-500">{new Date(grn.receivedDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{grn.supplierName}</div>
                            <div className="text-xs text-slate-400">Code: {grn.supplierCode}</div>
                            <div className="text-xs text-blue-600 font-mono font-bold mt-1">PO: {grn.poNo}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <span className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-black ${grn.iqcStatus === 'OK' ? 'text-green-600 bg-green-50 border border-green-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                                    IQC: {grn.iqcStatus}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Via: {grn.modeOfTransport || 'Direct'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-slate-900">{grn.items.length} Items</div>
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">
                                {grn.items.map(i => i.itemName).join(", ")}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => onEdit(grn)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"><Edit2 size={16} /></button>
                                <button onClick={() => onDelete(grn._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const WIPView = ({ data, onEdit, onDelete }) => {
    const [expandedPO, setExpandedPO] = useState({});
    const [expandedItem, setExpandedItem] = useState({});

    const groupedData = React.useMemo(() => {
        const tree = {};
        data.forEach(item => {
            const po = item.poNo || 'Internal / No PO';
            if (!tree[po]) tree[po] = {};
            const part = item.partName || 'Unknown Item';
            if (!tree[po][part]) tree[po][part] = [];
            tree[po][part].push(item);
        });
        return tree;
    }, [data]);

    return (
        <div className="space-y-3">
            {Object.entries(groupedData).map(([poNo, itemsByPart]) => (
                <div key={poNo} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                    <div
                        onClick={() => setExpandedPO(prev => ({ ...prev, [poNo]: !prev[poNo] }))}
                        className="bg-slate-50/80 px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
                    >
                        {expandedPO[poNo] ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronRight size={20} className="text-slate-500" />}
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">PO NUMBER</span>
                            <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{poNo}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Items:</span>
                            <span className="text-xs font-black text-slate-600">{Object.keys(itemsByPart).length}</span>
                        </div>
                    </div>

                    {expandedPO[poNo] && (
                        <div className="bg-white">
                            {Object.entries(itemsByPart).map(([partName, jobs]) => {
                                const itemKey = `${poNo}-${partName}`;
                                return (
                                    <div key={partName} className="border-b border-slate-100 last:border-0">
                                        <div
                                            onClick={() => setExpandedItem(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
                                            className="px-6 py-3 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            {expandedItem[itemKey] ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                    <Package size={16} className="text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">ITEM NAME</span>
                                                    <span className="font-bold text-slate-700 text-sm tracking-tight">{partName}</span>
                                                </div>
                                            </div>
                                            <div className="ml-auto text-[10px] font-black text-slate-400 uppercase bg-slate-100/50 px-2 py-1 rounded">
                                                {jobs.length} JOBS ACTIVATED
                                            </div>
                                        </div>

                                        {expandedItem[itemKey] && (
                                            <div className="bg-slate-50/30 px-6 pb-4 pt-1 space-y-2">
                                                {jobs.map(job => (
                                                    <div key={job._id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group hover:border-blue-400 hover:ring-2 hover:ring-blue-50 transition-all ml-8">
                                                        <div className="flex gap-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter mb-1">JOB NUMBER</span>
                                                                <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{job.jobNo}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">CURRENT MFG STEO</span>
                                                                <span className="text-xs font-black text-slate-700 uppercase">{job.currentStage || 'Processing'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-8">
                                                            <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                                                            <span className="text-[10px] font-black text-emerald-600 uppercase">PASS: {job.processedQty || job.qty}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></span>
                                                                            <span className="text-[10px] font-black text-rose-600 uppercase">FAIL: {job.rejectedQty || 0}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                                                        <div
                                                                            className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                                                                            style={{ width: `${Math.min(100, (((job.processedQty || job.qty) + (job.rejectedQty || 0)) / (job.initialQty || job.qty)) * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => onEdit(job)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                                                                    <button onClick={() => onDelete(job._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <Factory size={48} className="text-slate-200 mb-4" />
                    <p className="font-bold text-lg">No active work in progress</p>
                    <p className="text-sm">Newly started jobs will appear here automatically.</p>
                </div>
            )}
        </div>
    );
};

const FinishedGoodsView = ({ data, onEdit, onDelete }) => (
    <div className="space-y-4">
        {data.map((fg) => (
            <div key={fg._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-emerald-400 hover:shadow-md transition-all">
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TRACEABILITY IDENTIFIER</span>
                            <span className="text-base font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm font-mono">
                                JOB: {fg.jobNo}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Batch Info:</span>
                            <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">{fg.batchCode || 'No Batch'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-16">
                    <div className="flex gap-12">
                        <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL STARTED</div>
                            <div className="text-xl font-black text-slate-500 line-through decoration-rose-300 decoration-2">{fg.initialQty || fg.qty}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">LEFT AFTER FINAL QC</div>
                            <div className="text-3xl font-black text-emerald-600 tracking-tighter">
                                {fg.qty} <span className="text-xs font-bold text-emerald-400 tracking-normal ml-0.5 uppercase">UNITS READY</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => onEdit(fg)} className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"><Edit2 size={20} /></button>
                        <button onClick={() => onDelete(fg._id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><Trash2 size={20} /></button>
                    </div>
                </div>
            </div>
        ))}
        {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-300">
                <CheckCircle2 size={64} className="text-slate-100 mb-4" strokeWidth={1} />
                <p className="font-black text-xl text-slate-400 uppercase tracking-widest">No Finished Goods available</p>
                <p className="text-sm font-medium">Completed jobs will appear here after final QC approval.</p>
            </div>
        )}
    </div>
);

const RejectedGoodsView = ({ data, onEdit, onDelete }) => {
    // Group by Part Name
    const groupedData = React.useMemo(() => {
        const groups = {};
        data.forEach(item => {
            const name = item.partName || 'Unknown Item';
            if (!groups[name]) groups[name] = { totalQty: 0, items: [] };
            groups[name].totalQty += (item.qty || 0);
            groups[name].items.push(item);
        });
        return groups;
    }, [data]);

    return (
        <div className="space-y-4">
            {Object.entries(groupedData).map(([partName, group], idx) => (
                <RejectedItemCard
                    key={idx}
                    partName={partName}
                    totalQty={group.totalQty}
                    items={group.items}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

const RejectedItemCard = ({ partName, totalQty, items, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                    <div>
                        <h4 className="font-bold text-slate-900">{partName}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{items.length} Rejection Events</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block font-black text-xl text-red-600">{totalQty}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Rejected</span>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100"
                    >
                        <table className="w-full text-left text-xs bg-slate-50/30">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500">
                                    <th className="px-6 py-3 font-bold uppercase">Job / Step</th>
                                    <th className="px-6 py-3 font-bold uppercase">Rejected By</th>
                                    <th className="px-6 py-3 font-bold uppercase text-right">Qty</th>
                                    <th className="px-6 py-3 font-bold uppercase">Reason & Date</th>
                                    <th className="px-6 py-3 font-bold uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((rej, i) => (
                                    <tr key={rej._id || i} className="hover:bg-red-50/20 transition-colors border-b border-slate-50 last:border-none">
                                        <td className="px-6 py-3">
                                            <div className="font-black text-blue-600 uppercase">{rej.jobNo || 'N/A'}</div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">{rej.stepName || 'Unknown Step'}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-700">{rej.employeeName || 'Admin'}</div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-black text-red-600 text-sm">{rej.qty}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="italic text-slate-600">{rej.reason}</div>
                                            <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{new Date(rej.mfgDate || rej.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); onEdit(rej); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"><Edit2 size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(rej._id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Modal Component ---

const InventoryModal = ({ type, item, rawMaterialsList = [], partiesList = [], onClose, onSubmit }) => {
    const [formData, setFormData] = useState(item || {});
    const [saving, setSaving] = useState(false);

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        try {
            setSaving(true);
            await onSubmit(formData);
        } finally {
            setSaving(false);
        }
    };

    const renderForm = () => {
        switch (type) {
            case 'raw-materials':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Material Name</label>
                            <input required className="w-full p-2 border rounded" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Item Code (Unique)</label>
                            <input required className="w-full p-2 border rounded" value={formData.code || ''} onChange={e => updateField('code', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UOM</label>
                            <input
                                required
                                list="uom-list"
                                className="w-full p-2 border rounded"
                                value={formData.uom || ''}
                                onChange={e => updateField('uom', e.target.value)}
                                placeholder="Select or type UOM"
                            />
                            <datalist id="uom-list">
                                {COMMON_UOMS.map(uom => <option key={uom} value={uom} />)}
                            </datalist>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                            <input className="w-full p-2 border rounded" value={formData.category || ''} onChange={e => updateField('category', e.target.value)} placeholder="e.g. Chemicals, Metals, Packaging" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                            <textarea rows="3" className="w-full p-2 border rounded" value={formData.description || ''} onChange={e => updateField('description', e.target.value)} />
                        </div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">HSN Code</label><input className="w-full p-2 border rounded" value={formData.hsn || ''} onChange={e => updateField('hsn', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">GST Rate (%)</label><input type="number" className="w-full p-2 border rounded" value={formData.gstRate || ''} onChange={e => updateField('gstRate', parseFloat(e.target.value) || 0)} /></div>
                    </div>
                );
            case 'material-request':
                // Initialize items array if not present
                if (!formData.items) {
                    formData.items = [{ itemName: '', itemCode: '', qty: 0, uom: '' }];
                }
                const firstItem = formData.items[0];
                const updateFirstItem = (field, value) => {
                    const newItems = [...formData.items];
                    newItems[0] = { ...newItems[0], [field]: value };
                    updateField('items', newItems);
                };

                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">MR Number</label>
                                <input readOnly className="w-full p-2 border rounded bg-slate-50 font-bold text-blue-700" value={formData.mrNo || ''} placeholder="Click Auto to generate" />
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    const { mrNo } = await getNextMRNumber();
                                    updateField('mrNo', mrNo);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition"
                            >
                                Auto
                            </button>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Select Raw Material *</label>
                            <select
                                required
                                className="w-full p-2 border rounded"
                                value={firstItem.itemCode || ''}
                                onChange={e => {
                                    const selectedCode = e.target.value;
                                    const selectedRM = rawMaterialsList.find(rm => rm.code === selectedCode);
                                    if (selectedRM) {
                                        const newItems = [...formData.items];
                                        newItems[0] = {
                                            ...newItems[0],
                                            itemCode: selectedRM.code,
                                            itemName: selectedRM.name,
                                            uom: selectedRM.uom
                                        };
                                        updateField('items', newItems);
                                    }
                                }}
                            >
                                <option value="">-- Select Material --</option>
                                {rawMaterialsList.map(rm => (
                                    <option key={rm._id} value={rm.code}>{rm.name} ({rm.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Qty (Number) *</label>
                            <input required type="number" className="w-full p-2 border rounded" value={firstItem.qty || ''} onChange={e => updateFirstItem('qty', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UOM</label>
                            <input readOnly className="w-full p-2 border rounded bg-slate-50 font-medium" value={firstItem.uom || ''} placeholder="Auto-filled" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Required Date</label>
                            <input type="date" className="w-full p-2 border rounded" value={formData.requiredDate ? formData.requiredDate.slice(0, 10) : ''} onChange={e => updateField('requiredDate', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Purpose / Remarks</label>
                            <textarea rows="2" className="w-full p-2 border rounded" value={formData.purpose || ''} onChange={e => updateField('purpose', e.target.value)} placeholder="Why is this requested?" />
                        </div>
                    </div>
                );
            case 'grn':
                if (!formData.items) {
                    formData.items = [{ itemCode: '', itemName: '', qty: 0, uom: '', mfgDate: '', expDate: '', costPerUnit: 0, hsn: '', gstRate: 0, remarks: '' }];
                }

                const addItem = () => {
                    const newItems = [...formData.items, { itemCode: '', itemName: '', qty: 0, uom: '', mfgDate: '', expDate: '', costPerUnit: 0, hsn: '', gstRate: 0, remarks: '' }];
                    updateField('items', newItems);
                };

                const updateItem = (index, field, value) => {
                    const newItems = [...formData.items];
                    newItems[index] = { ...newItems[index], [field]: value };
                    updateField('items', newItems);
                };

                const removeItem = (index) => {
                    if (formData.items.length <= 1) return;
                    const newItems = formData.items.filter((_, i) => i !== index);
                    updateField('items', newItems);
                };

                return (
                    <div className="space-y-6">
                        <section className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="col-span-2 flex justify-between items-end mb-2">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">GRN Number</label>
                                    <div className="flex gap-2">
                                        <input readOnly className="flex-1 p-2 border rounded bg-white font-bold text-blue-700" value={formData.grnNumber || ''} placeholder="Click Auto to generate" />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const { grnNumber } = await getNextGRNNumber();
                                                updateField('grnNumber', grnNumber);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition"
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier Name *</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2 border rounded appearance-none bg-white"
                                        value={formData.supplierId || ''}
                                        onChange={e => {
                                            const selectedParty = partiesList.find(p => p._id === e.target.value);
                                            if (selectedParty) {
                                                updateField('supplierId', selectedParty._id);
                                                updateField('supplierName', selectedParty.name);
                                                updateField('supplierCode', selectedParty.vendorCode || '');
                                            } else {
                                                updateField('supplierId', '');
                                                updateField('supplierName', '');
                                                updateField('supplierCode', '');
                                            }
                                        }}
                                    >
                                        <option value="">-- Select Supplier from Parties --</option>
                                        {partiesList.filter(p => p.vendorCode).map(party => (
                                            <option key={party._id} value={party._id}>
                                                {party.name} {party.vendorCode ? `(${party.vendorCode})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier Code (Vendor Code)</label>
                                <input readOnly className="w-full p-2 border rounded bg-slate-100 text-slate-600 font-mono" value={formData.supplierCode || 'Auto-filled from Party'} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PO Number</label>
                                <input className="w-full p-2 border rounded" value={formData.poNo || ''} onChange={e => updateField('poNo', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Invoice No</label>
                                <input className="w-full p-2 border rounded" value={formData.invoiceNo || ''} onChange={e => updateField('invoiceNo', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Invoice Date</label>
                                <input type="date" className="w-full p-2 border rounded" value={formData.invoiceDate ? formData.invoiceDate.slice(0, 10) : ''} onChange={e => updateField('invoiceDate', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mode of Transport</label>
                                <input className="w-full p-2 border rounded" value={formData.modeOfTransport || ''} onChange={e => updateField('modeOfTransport', e.target.value)} placeholder="e.g. Courier, Vehicle, Hand" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">IQC Status</label>
                                <select className="w-full p-2 border rounded font-bold" value={formData.iqcStatus || 'OK'} onChange={e => updateField('iqcStatus', e.target.value)}>
                                    <option value="OK">OK ✅</option>
                                    <option value="NOT OK">NOT OK ❌</option>
                                </select>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Received Items</h3>
                                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm">
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>

                            {formData.items.map((item, index) => (
                                <div key={index} className="p-4 bg-white border border-slate-200 rounded-md relative group hover:border-blue-200 transition-colors shadow-sm">
                                    {formData.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition opacity-0 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                            <div className="md:col-span-5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Raw Material Item *</label>
                                                <select
                                                    required
                                                    className="w-full p-2.5 text-xs border rounded-lg bg-white focus:border-blue-500 ring-offset-2 ring-blue-50 focus:ring-2 outline-none transition-all shadow-sm"
                                                    value={item.itemCode || ''}
                                                    onChange={e => {
                                                        const selectedCode = e.target.value;
                                                        const selectedRM = rawMaterialsList.find(rm => rm.code === selectedCode);
                                                        if (selectedRM) {
                                                            const newItems = [...formData.items];
                                                            newItems[index] = {
                                                                ...newItems[index],
                                                                itemCode: selectedRM.code,
                                                                itemName: selectedRM.name,
                                                                uom: selectedRM.uom,
                                                                hsn: selectedRM.hsn || '',
                                                                gstRate: selectedRM.gstRate || 0
                                                            };
                                                            updateField('items', newItems);
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Select RM --</option>
                                                    {rawMaterialsList.map(rm => (
                                                        <option key={rm._id} value={rm.code}>
                                                            {rm.name} ({rm.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Batch Code / No</label>
                                                <input placeholder="BATCH NUMBER" className="w-full p-2.5 text-xs border rounded-lg uppercase bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all shadow-sm" value={item.batchCode || ''} onChange={e => updateItem(index, 'batchCode', e.target.value)} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Recv Qty</label>
                                                <div className="relative">
                                                    <input required type="number" step="any" placeholder="0.00" className="w-full p-2.5 text-xs border rounded-lg font-bold text-blue-700 bg-white focus:border-blue-500 outline-none transition-all shadow-sm" value={item.qty || ''} onChange={e => updateItem(index, 'qty', parseFloat(e.target.value) || 0)} />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">{item.uom || '-'}</div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cost/Unit</label>
                                                <div className="relative">
                                                    <input required type="number" step="any" placeholder="0.00" className="w-full p-2.5 text-xs border rounded-lg font-bold text-emerald-700 bg-white focus:border-emerald-500 outline-none transition-all shadow-sm" value={item.costPerUnit || ''} onChange={e => updateItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)} />
                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₹</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2 border-t border-slate-50">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Manufacturing Date</label>
                                                <input type="date" className="w-full p-2.5 text-xs border rounded-lg bg-white focus:border-blue-500 outline-none transition-all shadow-sm" value={item.mfgDate ? item.mfgDate.slice(0, 10) : ''} onChange={e => updateItem(index, 'mfgDate', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Expiry / Best Before</label>
                                                <input type="date" className="w-full p-2.5 text-xs border rounded-lg bg-white focus:border-red-500 outline-none transition-all shadow-sm" value={item.expDate ? item.expDate.slice(0, 10) : ''} onChange={e => updateItem(index, 'expDate', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">HSN Code</label>
                                                <input readOnly className="w-full p-2.5 text-xs border rounded-lg bg-slate-100 text-slate-500 font-mono" value={item.hsn || 'N/A'} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">GST Rate (%)</label>
                                                <input readOnly className="w-full p-2.5 text-xs border rounded-lg bg-slate-100 text-slate-500 font-bold" value={item.gstRate ? `${item.gstRate}%` : '0%'} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Remarks</label>
                                                <input className="w-full p-2.5 text-xs border rounded-lg bg-white focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Notes for this item..." value={item.remarks || ''} onChange={e => updateItem(index, 'remarks', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                );

            case 'wip':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">WIP Item / Part Name</label><input required className="w-full p-2 border rounded" value={formData.partName || ''} onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Job No / Batch No</label><input required className="w-full p-2 border rounded bg-blue-50/50" value={formData.jobNo || ''} onChange={e => updateField('jobNo', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Current Stage</label><input required className="w-full p-2 border rounded" value={formData.currentStage || ''} onChange={e => updateField('currentStage', e.target.value)} placeholder="e.g. Printing, Cutting" /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Quantity</label><input required type="number" className="w-full p-2 border rounded font-bold text-blue-600" value={formData.qty || ''} onChange={e => updateField('qty', parseFloat(e.target.value) || 0)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UOM</label><input className="w-full p-2 border rounded" value={formData.uom || ''} onChange={e => updateField('uom', e.target.value)} placeholder="kg, meters, etc" /></div>
                    </div>
                );
            case 'finished':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Finished Part Name</label><input required className="w-full p-2 border rounded" value={formData.partName || ''} onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Job / PO Number</label><input required className="w-full p-2 border rounded" value={formData.jobNo || ''} onChange={e => updateField('jobNo', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Batch Code</label><input required className="w-full p-2 border rounded bg-emerald-50/50" value={formData.batchCode || ''} onChange={e => updateField('batchCode', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Finished Qty</label><input required type="number" className="w-full p-2 border rounded font-black text-emerald-600" value={formData.qty || ''} onChange={e => updateField('qty', parseFloat(e.target.value) || 0)} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">QC Status</label>
                            <select className="w-full p-2 border rounded font-bold" value={formData.qcStatus || 'OK'} onChange={e => updateField('qcStatus', e.target.value)}>
                                <option value="OK">OK ✅</option>
                                <option value="HELD">HELD ⚠️</option>
                            </select>
                        </div>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rejected Item Name</label><input required className="w-full p-2 border rounded" value={formData.partName || ''} onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Job / Step Ref</label><input required className="w-full p-2 border rounded" value={formData.jobNo || ''} onChange={e => updateField('jobNo', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Employee / Inspector</label><input required className="w-full p-2 border rounded" value={formData.employee || ''} onChange={e => updateField('employee', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rejected Qty</label><input required type="number" className="w-full p-2 border rounded text-red-600 font-bold" value={formData.qty || ''} onChange={e => updateField('qty', parseFloat(e.target.value) || 0)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rejection Date</label><input type="date" className="w-full p-2 border rounded" value={formData.mfgDate ? formData.mfgDate.slice(0, 10) : ''} onChange={e => updateField('mfgDate', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Why was it rejected? (Mandatory)</label><textarea required rows="3" className="w-full p-2 border rounded" value={formData.reason || ''} onChange={e => updateField('reason', e.target.value)} /></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-md shadow-md w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{item ? 'Edit' : 'Add New'} {type.replace('-', ' ').toUpperCase()}</h2>
                        <p className="text-xs text-slate-500 mt-1">Please fill in all the required fields correctly.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-slate-200"><X size={20} className="text-slate-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
                    {renderForm()}
                </form>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                    <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2 border rounded-md hover:bg-white transition text-slate-600 font-medium disabled:opacity-50">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-10 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-bold shadow-sm shadow-blue-200 disabled:bg-slate-400"
                    >
                        {saving ? 'Saving...' : `Save ${type.replace(/-/g, ' ')}`}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Inventory;

