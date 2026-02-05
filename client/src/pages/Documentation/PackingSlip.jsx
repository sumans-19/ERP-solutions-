import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Archive, Box, Calculator, Printer, CheckCircle,
    RefreshCcw, Search, ChevronRight, Hash, Layers,
    Briefcase, AlertCircle, FileText, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PackingSlip = ({ setActiveSection }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [boxCapacity, setBoxCapacity] = useState(1000);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSlip, setActiveSlip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/invoices');
            // Show only Confirmed invoices (not yet packed)
            setInvoices(response.data.filter(inv => inv.status === 'Confirmed'));
        } catch (err) {
            console.error('Failed to fetch invoices', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePackingSlip = async () => {
        if (!selectedInvoice) return;
        if (boxCapacity <= 0) return alert('Enter valid box capacity');

        try {
            setIsGenerating(true);
            const response = await axios.post('/api/packing-slips/generate', {
                invoiceId: selectedInvoice._id,
                boxCapacity: parseInt(boxCapacity)
            });
            setActiveSlip(response.data);
            alert('Packing Slip Generated!');
        } catch (err) {
            alert('Failed to generate: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
            <RefreshCcw className="animate-spin mr-3" />
            <span className="font-black uppercase tracking-widest text-sm">Loading Packing Queue...</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden px-8 py-8">
            {/* Header section */}
            <div className="flex justify-between items-end mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Archive className="text-blue-600" size={32} />
                        PACKING <span className="text-blue-600 text-lg font-black bg-blue-50 px-2 py-0.5 rounded ml-2">SLIP</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest">Calculate boxes and generate shipping documentation</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveSection('docs-dashboard')}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw size={12} className="rotate-180" /> Back to Dashboard
                    </button>
                    {!activeSlip && (
                        <div className="relative group text-right border-l border-slate-200 pl-4 ml-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Search Invoice</label>
                            <input
                                type="text"
                                placeholder="Invoice or Customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!activeSlip ? (
                        <div className="grid grid-cols-12 gap-8 h-full">
                            {/* Pending Invoices List */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden"
                            >
                                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash size={14} /> Pending Invoices for Packing
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Invoice No</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Customer</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b text-right">Total Qty</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase border-b">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInvoices.map((inv) => (
                                                <tr key={inv._id} className={`hover:bg-slate-50/80 transition-colors border-b border-slate-50 ${selectedInvoice?._id === inv._id ? 'bg-blue-50/50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-black text-blue-600 text-xs">{inv.invoiceNo}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">{new Date(inv.createdAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{inv.customerName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900">{inv.totalQty}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedInvoice(inv)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedInvoice?._id === inv._id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-white hover:shadow-sm hover:text-blue-600 border border-transparent hover:border-blue-200'}`}
                                                        >
                                                            {selectedInvoice?._id === inv._id ? 'Selected' : 'Select'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                            {/* Packing Parameters */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-4 space-y-6"
                            >
                                <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Calculator size={14} /> Packing Configuration
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Box Capacity (Units per Box)</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="number"
                                                    value={boxCapacity}
                                                    onChange={(e) => setBoxCapacity(e.target.value)}
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-black focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                                                    <Box size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {selectedInvoice && (
                                            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">Estimated Boxes</span>
                                                    <span className="text-xl font-black text-white">{Math.ceil(selectedInvoice.totalQty / boxCapacity)}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            disabled={!selectedInvoice || isGenerating}
                                            onClick={handleGeneratePackingSlip}
                                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isGenerating ? <RefreshCcw className="animate-spin" size={16} /> : <FileText size={16} />}
                                            Generate Packing Slip
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                                    <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={16} />
                                    <p className="text-[9px] font-bold text-blue-800 leading-normal uppercase tracking-wide">
                                        The system will automatically split lots across boxes if a lot exceeds capacity, and will combine multiple lots into a single box if space permits (Mixed-Lot logic).
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        /* Packing Slip Result / Printable View */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden"
                        >
                            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-emerald-400" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Packing Slip Generated</div>
                                        <div className="text-sm font-black uppercase">{activeSlip.packingSlipNo}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 flex items-center gap-2"
                                    >
                                        <Printer size={14} /> Print
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('docs-dispatch')}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2"
                                    >
                                        Proceed to Dispatch <ChevronRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => setActiveSlip(null)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 print:bg-white print:p-0">
                                <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-10 border border-slate-100 print:shadow-none print:border-none print:max-w-none">
                                    {/* Document Header */}
                                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                                        <div>
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic underline decoration-blue-500 underline-offset-8">PACKING SLIP</h2>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ref: <span className="text-slate-900">{activeSlip.packingSlipNo}</span></p>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Inv: <span className="text-slate-900">{activeSlip.invoiceNo}</span></p>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Date: <span className="text-slate-900">{new Date().toLocaleDateString()}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-2 ml-auto">E</div>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Elints Enterprise OMS</p>
                                            <p className="text-[10px] font-bold text-slate-400 max-w-[200px] ml-auto">Logistics & Distribution Network Official Documentation</p>
                                        </div>
                                    </div>

                                    {/* Box Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                        {activeSlip.boxes.map((box, idx) => (
                                            <div key={idx} className="border-2 border-slate-900 rounded-2xl p-5 relative overflow-hidden flex flex-col bg-white hover:shadow-xl transition-all">
                                                <div className="absolute top-0 right-0 bg-slate-900 text-white px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl tracking-widest">
                                                    BOX {box.boxNumber} / {box.totalBoxes}
                                                </div>
                                                <div className="mb-4">
                                                    <Box size={24} className="text-slate-900 mb-2" />
                                                    <div className="text-2xl font-black text-slate-900">{box.totalQty} <span className="text-[10px] font-bold text-slate-400 tracking-widest">UNITS</span></div>
                                                </div>
                                                <div className="mt-auto space-y-2">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Lot Contents</div>
                                                    {box.lots.map((lot, lIdx) => (
                                                        <div key={lIdx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-blue-600">{lot.lotNumber}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[100px]">{lot.sourceRef}</span>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900">{lot.qty}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Summary */}
                                    <div className="border-t-2 border-slate-900 pt-8 flex justify-between items-center text-slate-900">
                                        <div className="flex gap-12">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Consignment Weight</p>
                                                <p className="text-sm font-black uppercase">TBD KG</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unit Count</p>
                                                <p className="text-sm font-black uppercase">{activeSlip.totalQty} Units</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Authorized Logistic Signature</p>
                                            <div className="w-48 h-12 bg-slate-50 border-b-2 border-slate-300 ml-auto"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PackingSlip;
