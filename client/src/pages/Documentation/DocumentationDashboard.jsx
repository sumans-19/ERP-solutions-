import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../services/api'; // Ensure global axios baseline is set (baseURL, interceptors)

const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';
import {
    LayoutDashboard, Search, Package, CheckCircle2,
    ArrowRightCircle, Trash2, AlertCircle, RefreshCcw,
    FileText, Archive, ChevronRight, Truck, User, Plus, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentationDashboard = ({ setActiveSection }) => {
    const [fgStock, setFgStock] = useState([]);
    const [masterStock, setMasterStock] = useState([]);
    const [inDocs, setInDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterSearch, setMasterSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedMasterItem, setSelectedMasterItem] = useState(null);
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [pullQty, setPullQty] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pullLoading, setPullLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, ids: [], remark: '' });
    const [dispatchHistory, setDispatchHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [stockRes, docsRes, historyRes] = await Promise.all([
                axios.get('/api/finished-goods'),
                axios.get('/api/documentation/items'),
                axios.get('/api/dispatch/history')
            ]);
            setFgStock(stockRes.data.filter(item => item.status === 'In Stock' || !item.status));
            setInDocs(docsRes.data);
            setDispatchHistory(historyRes.data);

            // Also fetch master stock for the modal pre-emptive or on open
            const masterRes = await axios.get('/api/documentation/items-with-stock');
            setMasterStock(masterRes.data);
        } catch (err) {
            console.error('Failed to fetch documentation data', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePullFromMaster = async (itemId, qty) => {
        try {
            setPullLoading(true);
            await axios.post('/api/documentation/pull-from-master', { itemId, qty });
            setShowMasterModal(false);
            await fetchData();
        } catch (err) {
            alert('Pull failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setPullLoading(false);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handlePushToDocs = async () => {
        if (selectedIds.length === 0) return;
        try {
            setActionLoading(true);
            await axios.post('/api/documentation/push-to-docs', { fgIds: selectedIds });
            setSelectedIds([]);
            await fetchData();
        } catch (err) {
            alert('Push failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteFromFG = async () => {
        if (!deleteModal.remark) return alert('Remark is mandatory');
        try {
            setActionLoading(true);
            await axios.post('/api/documentation/delete-from-fg', {
                fgIds: deleteModal.ids,
                remark: deleteModal.remark
            });
            setDeleteModal({ isOpen: false, ids: [], remark: '' });
            await fetchData();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredStock = fgStock.filter(item =>
        item.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jobNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rejectionId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden px-6 py-6">
            {/* Header section */}
            <div className="flex justify-between items-center mb-6 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-blue-600" size={28} />
                        DOCUMENTATION <span className="text-blue-600 text-sm font-black bg-blue-50 px-2 py-0.5 rounded ml-2">DASHBOARD</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] mt-1 uppercase tracking-widest leading-none">Select items from Finished Goods to start documentation flow</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Part Name, Code, Lot or Rejection..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-bold w-96 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
                {/* Upper Section: Stock & Queue */}
                <div className="grid grid-cols-12 gap-6 h-[55%] min-h-0 shrink-0">
                    {/* Left Panel: Available Stock */}
                    <div className="col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Package size={14} className="text-slate-400" /> Finished Goods Stock (Available)
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowMasterModal(true)}
                                    className="px-4 py-1.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Database size={14} className="text-blue-500" />
                                    Fetch Master Stock
                                </button>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handlePushToDocs}
                                        disabled={actionLoading}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading ? <RefreshCcw size={12} className="animate-spin" /> : <ArrowRightCircle size={14} />}
                                        Push {selectedIds.length} Items
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredStock.length && filteredStock.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds(filteredStock.map(i => i._id));
                                                    else setSelectedIds([]);
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Item Details</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Source Ref</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredStock.map((item) => (
                                            <motion.tr
                                                key={item._id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className={`group hover:bg-slate-50/80 transition-colors border-b border-slate-50 ${selectedIds.includes(item._id) ? 'bg-blue-50/40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item._id)}
                                                        onChange={() => handleToggleSelect(item._id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{item.partName}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase">{item.partNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.rejectionId ? 'text-red-500' : 'text-blue-500'}`}>
                                                            {item.rejectionId ? 'Customer Rejection' : 'Internal Production'}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-700">{item.rejectionId || item.jobNo || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-1 rounded">{item.qty}</span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {filteredStock.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-20 text-center">
                                                <Archive size={48} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">No items available for documentation</p>
                                                <button
                                                    onClick={() => setShowMasterModal(true)}
                                                    className="text-blue-500 font-black text-[10px] uppercase tracking-widest hover:underline"
                                                >
                                                    Manual Pull from Master Stock?
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Panel: In-Documentation Flow */}
                    <div className="col-span-5 flex flex-col bg-slate-900 rounded-2xl shadow-xl overflow-hidden shadow-blue-900/10 transition-all border border-slate-800">
                        <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-blue-500" /> Currently In Documentation stage
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {inDocs.map((item) => (
                                <div key={item._id} className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 group hover:border-slate-700 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="text-xs font-black text-slate-200 truncate">{item.partName}</div>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.rejectionId ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                {item.rejectionId ? 'Rejection' : 'Production'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <span className="uppercase">{item.partNo}</span>
                                            <span className="text-slate-700">•</span>
                                            <span className="text-blue-500">{item.jobNo || item.rejectionId}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="text-sm font-black text-white">{item.qty} <span className="text-[10px] text-slate-500">UNITS</span></div>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, ids: [item._id], remark: '' })}
                                            className="text-red-500 hover:text-red-400 transition-colors p-1"
                                            title="Delete from FG"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {inDocs.length === 0 && (
                                <div className="text-center py-20 opacity-30">
                                    <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Queue is empty</p>
                                </div>
                            )}
                        </div>

                        {inDocs.length > 0 && (
                            <div className="p-4 bg-slate-900/80 border-t border-slate-800">
                                <button
                                    onClick={() => setActiveSection('docs-invoicing')}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group transition-all"
                                >
                                    Proceed to Invoicing Stage <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lower Section: Dispatch History */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Archive size={14} className="text-slate-400" /> Recent Dispatches (History)
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">
                            {dispatchHistory.length} Consignments
                        </span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="bg-slate-50/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Consignment Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Customer / Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Shipment Info</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Status</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dispatchHistory.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 text-sm">{item.packingSlipNo}</div>
                                            <div className="text-[10px] text-slate-400 font-bold">{new Date(item.dispatchDetails?.dispatchedAt || item.updatedAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-slate-700">{item.invoiceId?.customerName}</div>
                                            <div className="text-[10px] font-black text-blue-500 uppercase">{item.invoiceNo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Truck size={14} className="text-slate-400" />
                                                {item.dispatchDetails?.vehicleNo || 'N/A'}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase ml-5">{item.invoiceId?.shipmentMode}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                                Dispatched
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedHistory(item)}
                                                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {dispatchHistory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center opacity-30 italic font-medium text-slate-500">
                                            No dispatch history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Safety Deletion Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                    >
                        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-600 uppercase tracking-tight">Safety Deletion</h3>
                                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Confirm removal from finished goods</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                You are about to permanently remove these items from Finished Goods stock. This action is irreversible once confirmed.
                            </p>
                            <label className="block">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mandatory Removal Remark</span>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none h-24"
                                    placeholder="e.g., Successfully invoiced and dispatched. Records updated."
                                    value={deleteModal.remark}
                                    onChange={(e) => setDeleteModal(prev => ({ ...prev, remark: e.target.value }))}
                                />
                            </label>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, ids: [], remark: '' })}
                                className="flex-1 py-3 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteFromFG}
                                disabled={!deleteModal.remark || actionLoading}
                                className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Confirm Deletion'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Dispatch Detail Modal */}
            {selectedHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200"
                    >
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Consignment Details</h3>
                                    <div className="flex gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>REF: {selectedHistory.packingSlipNo}</span>
                                        <span>•</span>
                                        <span className="text-blue-400">INV: {selectedHistory.invoiceNo}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center transition-colors"
                            >
                                <RefreshCcw className="rotate-45" size={20} />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-12 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="col-span-4 space-y-6">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} className="text-blue-500" /> Logistics Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">Vehicle Number</div>
                                            <div className="text-sm font-black text-slate-900">{selectedHistory.dispatchDetails?.vehicleNo || 'Internal Transfer'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">Driver Details</div>
                                            <div className="text-sm font-bold text-slate-700">{selectedHistory.dispatchDetails?.driverName || 'N/A'}</div>
                                            <div className="text-[10px] text-slate-500">{selectedHistory.dispatchDetails?.contactNo}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase">Dispatched At</div>
                                            <div className="text-sm font-bold text-slate-700">
                                                {new Date(selectedHistory.dispatchDetails?.dispatchedAt || selectedHistory.updatedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-blue-500" /> Remarks
                                    </h4>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                        "{selectedHistory.dispatchDetails?.remarks || 'No special instructions provided for this dispatch.'}"
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-8 flex flex-col min-h-0">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} className="text-blue-500" /> Dispatched Items & Lot Traceability
                                </h4>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Box #</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Lot Number</th>
                                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Source Reference</th>
                                                <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase">Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedHistory.boxes?.map(box => (
                                                <React.Fragment key={box._id}>
                                                    {box.lots.map((lot, idx) => (
                                                        <tr key={lot._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                {idx === 0 ? <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">BOX {box.boxNumber}</span> : ''}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-xs font-black text-blue-600 tracking-tight">{lot.lotNumber}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-[10px] font-bold text-slate-700">{lot.rejectionId || lot.jobNo}</div>
                                                                <span className={`text-[8px] font-black uppercase ${lot.rejectionId ? 'text-red-500' : 'text-blue-500'}`}>
                                                                    {lot.rejectionId ? 'Customer Rejection' : 'Internal Production'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-black text-slate-900 text-xs">{lot.qty}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-900 text-white">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Total Quantity</td>
                                                <td className="px-4 py-4 text-right text-lg font-black">{selectedHistory.totalQty}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedHistory(null)}
                                className="px-10 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Close Details
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Master Stock Pull Modal */}
            {showMasterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]"
                    >
                        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pull from Master Stock</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select items with existing inventory</p>
                                </div>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search Master..."
                                    value={masterSearch}
                                    onChange={(e) => setMasterSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-48 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Code</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</th>
                                        <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {masterStock
                                        .filter(i => (i.name + i.code).toLowerCase().includes(masterSearch.toLowerCase()))
                                        .map((item) => (
                                            <tr key={item._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.name}</td>
                                                <td className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{item.code}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-900">{item.currentStock} {item.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMasterItem(item);
                                                            setPullQty(item.currentStock.toString());
                                                            setShowQtyModal(true);
                                                        }}
                                                        disabled={pullLoading}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Pull into Documentation"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    {masterStock.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                                No items found with current stock in master.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setShowMasterModal(false)}
                                className="px-6 py-2 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-slate-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Custom Quantity Modal */}
            {showQtyModal && selectedMasterItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Package size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{selectedMasterItem.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedMasterItem.code}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Quantity to Pull ({selectedMasterItem.unit})
                                    </label>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={pullQty}
                                        onChange={(e) => setPullQty(e.target.value)}
                                        max={selectedMasterItem.currentStock}
                                        min="1"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-black text-slate-900 focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Stock:</span>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedMasterItem.currentStock} {selectedMasterItem.unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowQtyModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const qty = Number(pullQty);
                                        if (qty > 0 && qty <= selectedMasterItem.currentStock) {
                                            handlePullFromMaster(selectedMasterItem._id, qty);
                                            setShowQtyModal(false);
                                        } else {
                                            alert(`Please enter a valid quantity (1 - ${selectedMasterItem.currentStock})`);
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
                                >
                                    Confirm Pull
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default DocumentationDashboard;
