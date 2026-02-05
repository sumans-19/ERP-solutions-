import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity, Truck, User, Phone, CheckCircle,
    RefreshCcw, Search, Hash, Box, Package,
    AlertCircle, FileText, MapPin, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dispatch = ({ setActiveSection }) => {
    const [readySlips, setReadySlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [dispatchForm, setDispatchForm] = useState({
        vehicleNo: '',
        driverName: '',
        contactNo: '',
        remarks: ''
    });
    const [isConfirming, setIsConfirming] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReadySlips();
    }, []);

    const fetchReadySlips = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/dispatch/ready');
            setReadySlips(response.data);
        } catch (err) {
            console.error('Failed to fetch slips', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDispatch = async () => {
        if (!selectedSlip) return;
        if (!dispatchForm.vehicleNo || !dispatchForm.driverName) {
            return alert('Vehicle Number and Driver Name are required');
        }

        try {
            setIsConfirming(true);
            await axios.post('/api/dispatch/confirm', {
                packingSlipId: selectedSlip._id,
                ...dispatchForm
            });
            alert('Consignment Dispatched Successfully!');
            setSelectedSlip(null);
            setDispatchForm({ vehicleNo: '', driverName: '', contactNo: '', remarks: '' });
            await fetchReadySlips();
        } catch (err) {
            alert('Dispatch failed: ' + err.message);
        } finally {
            setIsConfirming(false);
        }
    };

    const filteredSlips = readySlips.filter(slip =>
        slip.packingSlipNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
            <RefreshCcw className="animate-spin mr-3" />
            <span className="font-black uppercase tracking-widest text-sm">Loading Dispatch Queue...</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden px-8 py-8">
            {/* Header section */}
            <div className="flex justify-between items-end mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Truck className="text-blue-600" size={32} />
                        DISPATCH <span className="text-blue-600 text-lg font-black bg-blue-50 px-2 py-0.5 rounded ml-2">TERMINAL</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest">Finalize consignments and record logistics data</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveSection('docs-dashboard')}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw size={12} className="rotate-180" /> Back to Dashboard
                    </button>
                    <div className="relative group text-right border-l border-slate-200 pl-4 ml-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Quick Search</label>
                        <input
                            type="text"
                            placeholder="Slip or Invoice No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-12 gap-8 h-full">
                    {/* Dispatch Queue */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden"
                    >
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" /> Pending Consignments
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Consignment Ref</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase border-b">Invoiced Ref</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase border-b">Units / Boxes</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase border-b">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSlips.map((slip) => (
                                        <tr key={slip._id} className={`hover:bg-slate-50/80 transition-colors border-b border-slate-50 ${selectedSlip?._id === slip._id ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-900 text-xs">{slip.packingSlipNo}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ready for Transit</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-blue-600 text-xs">{slip.invoiceNo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="font-black text-slate-900 text-sm">{slip.totalQty} <span className="text-[9px] text-slate-400">UNITS</span></div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase">{slip.totalBoxes} BOXES</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedSlip(slip)}
                                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedSlip?._id === slip._id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-white hover:shadow-sm hover:text-blue-600 border border-transparent hover:border-blue-200'}`}
                                                >
                                                    {selectedSlip?._id === slip._id ? 'Active' : 'Prepare'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSlips.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-20 text-center opacity-30 italic font-medium text-slate-500">
                                                No consignments ready for dispatch.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Logistics Entry Form */}
                    <div className="col-span-5 flex flex-col gap-6">
                        <AnimatePresence mode="wait">
                            {selectedSlip ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800 flex flex-col h-full"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
                                            <Navigation size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Consignment Transit</h3>
                                            <p className="text-xl font-black text-white">{selectedSlip.packingSlipNo}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                    <Hash size={10} /> Vehicle Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dispatchForm.vehicleNo}
                                                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                                                    placeholder="KA-01-AB-1234"
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                    <User size={10} /> Driver Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dispatchForm.driverName}
                                                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                                                    placeholder="John Doe"
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                <Phone size={10} /> Contact Number
                                            </label>
                                            <input
                                                type="text"
                                                value={dispatchForm.contactNo}
                                                onChange={(e) => setDispatchForm({ ...dispatchForm, contactNo: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                <FileText size={10} /> Consignment Remarks
                                            </label>
                                            <textarea
                                                value={dispatchForm.remarks}
                                                onChange={(e) => setDispatchForm({ ...dispatchForm, remarks: e.target.value })}
                                                placeholder="Any special handling instructions..."
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleConfirmDispatch}
                                        disabled={isConfirming}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-8"
                                    >
                                        {isConfirming ? <RefreshCcw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                        Finalize & Confirm Dispatch
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-2xl p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center h-full"
                                >
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                        <MapPin size={40} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Ready for Transit</h3>
                                    <p className="text-xs font-bold text-slate-400 max-w-[200px] leading-relaxed">
                                        Select a packing slip from the queue to record logistics and finalize the dispatch flow.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                            <AlertCircle className="text-emerald-600 mt-1 shrink-0" size={16} />
                            <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
                                Confirming dispatch will automatically update <span className="underline">Finished Good</span> statuses to 'Dispatched' and lock the invoice from further modifications.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dispatch;
