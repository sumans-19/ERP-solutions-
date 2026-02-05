import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Search, User, Truck, Receipt, CheckCircle,
    ChevronRight, ArrowLeft, RefreshCcw, Package,
    Layers, Briefcase, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Invoicing = ({ setActiveSection }) => {
    const [docsItems, setDocsItems] = useState([]);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [shipmentMode, setShipmentMode] = useState('By Road');
    const [remarks, setRemarks] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Items, 2: Customer & Details

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, partiesRes] = await Promise.all([
                axios.get('/api/documentation/items'),
                axios.get('/api/parties')
            ]);
            setDocsItems(itemsRes.data);
            setParties(partiesRes.data);
        } catch (err) {
            console.error('Fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (item) => {
        const isSelected = selectedItems.some(i => i._id === item._id);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(i => i._id !== item._id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleCreateInvoice = async () => {
        if (!customer) return alert('Please select a customer');
        try {
            setIsCreating(true);
            const payload = {
                customerId: customer._id,
                customerName: customer.name,
                selectedFGItems: selectedItems.map(i => i._id),
                shipmentMode: shipmentMode,
                remarks: remarks
            };
            await axios.post('/api/invoices', payload);
            alert('Invoice Created Successfully!');
            setActiveSection('docs-packing'); // Navigate to next logic step
        } catch (err) {
            alert('Failed to create invoice: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    // Group selected items by source to show preview of Lots
    const lotPreview = selectedItems.reduce((acc, item) => {
        const source = item.jobNo || item.rejectionId || 'Stock';
        if (!acc[source]) acc[source] = { qty: 0, items: [] };
        acc[source].qty += item.qty;
        acc[source].items.push(item);
        return acc;
    }, {});

    const filteredDocsItems = docsItems.filter(item =>
        item.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jobNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rejectionId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
            <RefreshCcw className="animate-spin mr-3" />
            <span className="font-black uppercase tracking-widest text-sm">Loading Documentation Queue...</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Top Navigation / Breadcrumbs */}
            <div className="px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Receipt className="text-blue-600" size={32} />
                        INVOICING <span className="text-blue-600 text-lg font-black bg-blue-50 px-2 py-0.5 rounded ml-2">STAGE</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1. Select Items</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2. Details & Confirmation</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {step === 1 ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveSection('docs-dashboard')}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                            <button
                                disabled={selectedItems.length === 0}
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                Next Step: Logistics <ChevronRight size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleCreateInvoice}
                                disabled={isCreating || !customer}
                                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isCreating ? 'Processing...' : 'Confirm & Generate Invoice'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-8">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden"
                        >
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={14} /> Documentation Queue
                                </h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Fast find..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold w-64 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Select</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Item</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Source Reference</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase border-b">Stock Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDocsItems.map((item) => (
                                            <tr
                                                key={item._id}
                                                onClick={() => handleToggleSelect(item)}
                                                className={`cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-50 ${selectedItems.some(i => i._id === item._id) ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedItems.some(i => i._id === item._id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                        {selectedItems.some(i => i._id === item._id) && <CheckCircle size={12} />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-sm">{item.partName}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.partNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.rejectionId ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            {item.rejectionId ? 'Rejection' : 'Internal'}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-700">{item.rejectionId || item.jobNo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-900">{item.qty}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredDocsItems.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-20 text-center opacity-30 italic font-medium text-slate-500">
                                                    {docsItems.length === 0 ? 'Documentation queue is currently empty.' : 'No items match your search.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-12 gap-8 h-full">
                            {/* Invoicing Form */}
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="col-span-8 space-y-6"
                            >
                                {/* Customer Selection */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} className="text-blue-500" /> Customer Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Select Customer (Party)</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={customer?._id || ''}
                                                onChange={(e) => setCustomer(parties.find(p => p._id === e.target.value))}
                                            >
                                                <option value="">- Choose Customer -</option>
                                                {parties.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name} ({p.customerCode || 'N/A'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mode of Shipment</label>
                                            <div className="flex gap-2">
                                                {['By Road', 'By Air', 'By Courier', 'Self Pickup'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setShipmentMode(mode)}
                                                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl border transition-all ${shipmentMode === mode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Logistics / Invoice Remarks</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-20"
                                            placeholder="Shipping instructions, partial dispatch notes, etc."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Lot Generation Preview */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Layers size={14} className="text-blue-500" /> Systematic Lot Distribution
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(lotPreview).map(([source, data]) => (
                                            <div key={source} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Lot Source</span>
                                                    <span className="text-lg font-black text-slate-900">{data.qty}</span>
                                                </div>
                                                <div className="font-bold text-xs text-slate-700 truncate mb-1">{source}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">{data.items.length} Component Records</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-4">
                                        <AlertCircle className="text-blue-600 mt-0.5" size={16} />
                                        <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                                            System will automatically generate <span className="underline decoration-2 underline-offset-2">LOT/2026/SEQ</span> numbers for each unique source reference to ensure full regulatory traceability.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Selection Summary Side Panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-4 bg-slate-900 rounded-2xl p-6 shadow-2xl flex flex-col border border-slate-800"
                            >
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Briefcase size={14} /> Selection Summary
                                </h3>

                                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar-dark pr-2">
                                    {selectedItems.map(item => (
                                        <div key={item._id} className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold text-slate-200 truncate">{item.partName}</div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.jobNo || item.rejectionId}</div>
                                                </div>
                                                <div className="text-xs font-black text-blue-400 ml-4">{item.qty}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Quantity</span>
                                        <span className="text-2xl font-black text-white">{selectedItems.reduce((sum, i) => sum + i.qty, 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Lots</span>
                                        <span className="text-xl font-black text-blue-500">{Object.keys(lotPreview).length}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Invoicing;
