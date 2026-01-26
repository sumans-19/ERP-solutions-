import React, { useState, useEffect, useRef } from 'react';
import { FileText, Printer, Download, Search, FileCheck, Truck, Package, Layers } from 'lucide-react';
import { getAllOrders, getAllParties, getAllItems } from '../services/api';
import ReportCompanyHeader from '../components/ReportCompanyHeader';

const ReportManage = () => {
    const [orders, setOrders] = useState([]);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('invoice'); // invoice, dc, packing, full
    const [searchTerm, setSearchTerm] = useState('');

    const componentRef = useRef();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersData, partiesData] = await Promise.all([
                getAllOrders(),
                getAllParties()
            ]);
            setOrders(ordersData || []);
            setParties(partiesData || []);
        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter orders based on search
    const filteredOrders = orders.filter(order =>
        (order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.partyName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handlePrint = () => {
        window.print();
    };

    const getPartyDetails = (partyName) => {
        return parties.find(p => p.name === partyName) || {};
    };

    // Render Components
    const InvoiceTemplate = ({ order, party }) => {
        const total = order.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        return (
            <div className="bg-white p-10 min-h-[1123px] w-[794px] mx-auto shadow-lg print:shadow-none text-slate-900 leading-relaxed relative print:w-full print:h-[1123px]">
                <ReportCompanyHeader />
                {/* Header */}
                {/* Boxed Centered Header */}
                <div className="border-2 border-slate-800 text-center py-2 mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em]">Invoice</h1>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 italic">Original for Recipient</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-slate-700 mb-2 uppercase text-xs tracking-wider">Bill To</h3>
                        <div className="bg-slate-50 p-4 rounded border border-slate-100">
                            <p className="font-bold text-lg">{order.partyName}</p>
                            <p className="whitespace-pre-line text-slate-600 text-sm mt-1">{party?.billingAddress || 'Address not available'}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                            <span className="text-slate-500">Invoice No:</span>
                            <span className="font-mono font-bold text-slate-900">INV-{order.poNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                            <span className="text-slate-500">Date:</span>
                            <span className="font-medium">{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                            <span className="text-slate-500">PO Number:</span>
                            <span className="font-medium">{order.poNumber}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-slate-800 text-white text-sm uppercase tracking-wider print:bg-slate-800 print:text-white">
                            <th className="py-3 px-4 text-left rounded-l">Item Description</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-4 text-right">Unit Price</th>
                            <th className="py-3 px-4 text-right rounded-r">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {order.items?.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 px-4 font-medium">{item.item?.name || "Unknown Item"}</td>
                                <td className="py-3 px-4 text-center">{item.quantity || 0} {item.unit || 'Nos'}</td>
                                <td className="py-3 px-4 text-right">₹{item.rate?.toFixed(2) || '0.00'}</td>
                                <td className="py-3 px-4 text-right">₹{item.amount?.toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-300 pt-2 mt-2">
                            <span>Total Amount:</span>
                            <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                    <div className="text-xs text-slate-400 w-1/2">
                        <p>Terms & Conditions:</p>
                        <p>1. Payment due within 30 days.</p>
                        <p>2. Goods once sold will not be taken back.</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 mb-2 border-b border-slate-300 w-48"></div>
                        <p className="font-bold text-slate-700 text-sm">Authorized Signature</p>
                    </div>
                </div>
            </div >
        );
    };

    const DCTemplate = ({ order, party }) => (
        <div className="bg-white p-8 min-h-[1123px] w-[794px] mx-auto shadow-lg print:shadow-none text-slate-900 leading-tight relative print:w-full print:h-[1123px] border border-slate-200">
            <ReportCompanyHeader />
            {/* Boxed Centered Header */}
            <div className="border-[3px] border-slate-800 text-center py-3 mb-2">
                <h1 className="text-2xl font-black uppercase tracking-[0.4em]">Delivery Challan</h1>
            </div>
            <div className="text-center mb-8">
                <p className="text-[10px] font-bold text-slate-400 italic tracking-wider">“Not for Sale – For Transportation Only”</p>
            </div>

            {/* Top Info Section */}
            <div className="border border-slate-800 mb-8 bg-[#f7f9fc] p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-1">DC No:</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                            DC/{order.poNumber?.toString().toUpperCase().startsWith('PO-') ? order.poNumber : `PO-${order.poNumber || 'XXXX'}`}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-1">Date:</span>
                        <span className="font-bold text-slate-900 border-b border-slate-200 pb-1">{new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-1">PO Number:</span>
                        <span className="font-bold text-blue-900 border-b border-slate-200 pb-1">{order.poNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Bill To Section */}
            <div className="border border-slate-800 p-4 mb-8 bg-slate-50/50">
                <h3 className="font-black text-[9px] uppercase tracking-[0.2em] mb-2 text-slate-500 border-b border-slate-200 pb-1">Bill To / Consignee</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-bold text-lg text-slate-800">{order.partyName}</p>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-1">{party?.billingAddress || 'Address details not available'}</p>
                    </div>
                    <div className="text-xs space-y-1.5">
                        {party?.gstin && <p><span className="text-slate-400 font-medium uppercase text-[10px]">GSTIN:</span> <span className="font-bold">{party.gstin}</span></p>}
                        {party?.phone && <p><span className="text-slate-400 font-medium uppercase text-[10px]">Phone:</span> <span className="font-bold">{party.phone}</span></p>}
                        {party?.state && <p><span className="text-slate-400 font-medium uppercase text-[10px]">State:</span> <span className="font-bold">{party.state}</span></p>}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 border border-slate-800 rounded-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white text-[9px] uppercase font-bold tracking-widest print:bg-slate-800 print:text-white">
                            <th className="py-2.5 px-2 border-r border-slate-700 text-center w-12">Sl No</th>
                            <th className="py-2.5 px-4 border-r border-slate-700 text-left">Item Description</th>
                            <th className="py-2.5 px-2 border-r border-slate-700 text-center w-24">Quantity</th>
                            <th className="py-2.5 px-4 text-center w-24">Unit</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px]">
                        {(order.items && order.items.length > 0) ? order.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 even:bg-slate-50/50 last:border-0 transition-colors hover:bg-slate-50">
                                <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-500 font-medium">{index + 1}</td>
                                <td className="py-2 px-4 border-r border-slate-200 font-semibold text-slate-800">{item.item?.name}</td>
                                <td className="py-2 px-2 text-center border-r border-slate-200 font-black">{item.quantity}</td>
                                <td className="py-2 px-4 text-center text-slate-600 uppercase font-medium">{item.unit || 'Nos'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="py-20 text-center text-slate-400 italic">No items listed in database</td>
                            </tr>
                        )}
                        {/* Fill remaining space with subtle height */}
                        {[...Array(Math.max(0, 8 - (order.items?.length || 0)))].map((_, i) => (
                            <tr key={`empty-${i}`} className="h-6 border-b border-slate-50 last:border-0 even:bg-slate-50/20">
                                <td className="border-r border-slate-50"></td>
                                <td className="border-r border-slate-50"></td>
                                <td className="border-r border-slate-50"></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section: Notes */}
            <div className="bg-slate-50/80 border border-slate-200 p-3 mb-10 rounded-sm">
                <p className="text-[9px] font-black uppercase mb-1.5 text-slate-400 tracking-wider">Notes & Conditions:</p>
                <div className="space-y-1">
                    <p className="text-[9px] text-slate-500 flex gap-2"><span>1.</span> <span>Received the above mentioned goods in good condition.</span></p>
                    <p className="text-[9px] text-slate-500 flex gap-2"><span>2.</span> <span>This is a computer generated delivery challan.</span></p>
                </div>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-8">
                <div className="flex justify-between items-end pb-4">
                    <div className="text-center w-1/3">
                        <div className="h-20 mb-3 flex items-end justify-center">
                            <div className="border-t border-slate-300 w-full px-4 pt-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receiver's Signature</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="h-20 mb-3 flex flex-col items-center justify-end pt-6">
                            <div className="border-t border-slate-300 w-full px-4 pt-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const PackingSlipTemplate = ({ order, party }) => (
        <div className="bg-white p-10 min-h-[1123px] w-[794px] mx-auto shadow-lg print:shadow-none text-slate-900 font-sans relative print:w-full print:h-[1123px] border border-slate-200">
            <ReportCompanyHeader />
            {/* Boxed Centered Header */}
            <div className="border-[3px] border-slate-800 text-center py-3 mb-6">
                <h1 className="text-2xl font-black uppercase tracking-[0.4em]">Packing Slip</h1>
            </div>

            {/* Meta Row Section */}
            <div className="grid grid-cols-4 gap-0 border border-slate-800 mb-10 bg-[#f7f9fc]">
                <div className="p-3 border-r border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Package #</span>
                    <span className="font-bold text-slate-900 text-sm">PKG-{order.poNumber || 'N/A'}</span>
                </div>
                <div className="p-3 border-r border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Order Date</span>
                    <span className="font-bold text-slate-900 text-sm">{new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="p-3 border-r border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ship Date</span>
                    <span className="font-bold text-slate-900 text-sm">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div className="p-3 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">PO Number</span>
                    <span className="font-bold text-slate-900 text-sm">{order.poNumber || 'N/A'}</span>
                </div>
            </div>

            {/* Address Section */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <h3 className="font-black text-[9px] uppercase tracking-widest mb-2 text-slate-400 border-b border-slate-200 pb-1">Bill To:</h3>
                    <div className="text-slate-800 text-sm leading-relaxed">
                        <p className="font-black text-base">{order.partyName}</p>
                        <p className="whitespace-pre-line text-slate-600 mt-1">{party?.billingAddress || 'Address details not available'}</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-black text-[9px] uppercase tracking-widest mb-2 text-slate-400 border-b border-slate-200 pb-1">Ship To:</h3>
                    <div className="text-slate-800 text-sm leading-relaxed">
                        <p className="font-black text-base">{order.partyName}</p>
                        <p className="whitespace-pre-line text-slate-600 mt-1">{party?.shippingAddress || party?.billingAddress || 'Address details not available'}</p>
                    </div>
                </div>
            </div>

            {/* Items Table - Clean & Professional */}
            <div className="border border-slate-800 rounded-sm overflow-hidden mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white text-[9px] uppercase font-black tracking-widest print:bg-slate-800 print:text-white">
                            <th className="py-2.5 px-4 border-r border-slate-600 text-center w-20">SR NO</th>
                            <th className="py-2.5 px-6 border-r border-slate-600 text-left">Item Description</th>
                            <th className="py-2.5 px-6 text-center w-32">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px]">
                        {order.items?.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 even:bg-slate-50/50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-4 text-center border-r border-slate-200 text-slate-500 font-medium">{index + 1}</td>
                                <td className="py-2.5 px-6 border-r border-slate-200 font-semibold text-slate-800">{item.item?.name}</td>
                                <td className="py-2.5 px-6 text-center font-black text-slate-900 uppercase italic">{item.quantity || 0} {item.unit || 'Nos'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total Section */}
            <div className="flex justify-end pt-4 border-t border-slate-300">
                <div className="flex gap-8 items-center text-slate-700">
                    <span className="text-[10px] items-center font-black uppercase tracking-widest text-slate-400">Total Quantity</span>
                    <span className="text-2xl font-black">{order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-100 relative">
            {/* Header / Selector */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Report Manage</h1>
                        <p className="text-sm text-slate-500">Document Generation Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find PO Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {searchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                {filteredOrders.map(order => (
                                    <button
                                        key={order._id}
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setSearchTerm('');
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0"
                                    >
                                        <div className="font-bold text-slate-800">{order.poNumber || order._id}</div>
                                        <div className="text-xs text-slate-500 flex justify-between">
                                            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span>{order.partyName}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedOrder && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="text-xs font-bold text-blue-800">SELECTED:</span>
                            <span className="text-sm font-medium text-blue-900">{selectedOrder.poNumber || selectedOrder._id}</span>
                            <button onClick={() => setSelectedOrder(null)} className="ml-2 hover:bg-blue-200 rounded-full p-1"><span className="sr-only">Clear</span>&times;</button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={handlePrint} disabled={!selectedOrder} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                        <Printer size={18} />
                        <span>Print / Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto flex print:overflow-visible">
                {!selectedOrder ? (
                    <div className="p-8 max-w-7xl mx-auto w-full">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900">Available Orders</h2>
                                <p className="text-slate-500 text-sm mt-1">Select an order to generate reports</p>
                            </div>

                            {filteredOrders.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    No orders found matching your search.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">PO Number</th>
                                                <th className="px-6 py-4">Customer</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredOrders.map((order) => (
                                                <tr key={order._id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{order.poNumber}</td>
                                                    <td className="px-6 py-4 text-slate-800">{order.partyName}</td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                                                            ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                    'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                            {order.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setSearchTerm('');
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                                                        >
                                                            Select <Layers size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full h-full print:block">
                        {/* Tabs Sidebar */}
                        <div className="w-64 bg-white border-r border-slate-200 p-4 print:hidden">
                            <div className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('invoice')}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'invoice' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <FileCheck size={18} />
                                    Invoice Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('dc')}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dc' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Truck size={18} />
                                    DC Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('packing')}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'packing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Package size={18} />
                                    Packing Slip
                                </button>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <button
                                    onClick={() => setActiveTab('full')}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'full' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Layers size={18} />
                                    Overall Report
                                </button>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 overflow-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible relative">
                            <style>{`
                                @media print {
                                    @page { 
                                        size: A4 portrait; 
                                        margin: 0; 
                                    }
                                    
                                    /* Aggressive flattening of the entire app tree for print */
                                    /* We avoid forcing .flex to block to preserve justify-end/between alignments */
                                    html, body, #root, .h-screen, .flex-1, .overflow-hidden, .overflow-auto {
                                        height: auto !important;
                                        overflow: visible !important;
                                        position: static !important;
                                        min-height: auto !important;
                                        max-height: none !important;
                                        margin: 0 !important;
                                        padding: 0 !important;
                                    }

                                    /* Standard flex classes should still be flexible in print */
                                    .flex { display: flex !important; }
                                    .flex-col { display: flex !important; flex-direction: column !important; }
                                    .justify-end { justify-content: flex-end !important; }
                                    .justify-between { justify-content: space-between !important; }
                                    .items-end { align-items: flex-end !important; }
                                    .items-center { align-items: center !important; }
                                    .text-right { text-align: right !important; }
                                    .text-center { text-align: center !important; }

                                    /* Prevent margin collapse issues in some browsers */
                                    body { 
                                        background: white !important; 
                                        -webkit-print-color-adjust: exact !important; 
                                        print-color-adjust: exact !important;
                                    }

                                    .print-page-break { 
                                        page-break-before: always !important; 
                                        break-before: page !important;
                                        clear: both !important;
                                        display: block !important;
                                        width: 100% !important;
                                    }

                                    /* Ensure report containers take full width and don't shrink */
                                    .min-h-\\[1123px\\] {
                                        width: 100% !important;
                                        margin: 0 !important;
                                        border: none !important;
                                        box-shadow: none !important;
                                        display: block !important;
                                    }

                                    .print\\:hidden { display: none !important; }
                                    
                                    /* Hide interactive UI elements that might still be block displayed */
                                    nav, aside, header, .print-hidden { display: none !important; }
                                }
                            `}</style>

                            {(activeTab === 'invoice' || activeTab === 'full') && (
                                <div className="print:block mb-8 print:mb-0 relative">
                                    <InvoiceTemplate order={selectedOrder} party={getPartyDetails(selectedOrder.partyName)} />
                                </div>
                            )}

                            {(activeTab === 'dc' || activeTab === 'full') && (
                                <div className={`${activeTab === 'full' ? 'print-page-break' : ''} print:block mb-8 print:mb-0 relative`}>
                                    <DCTemplate order={selectedOrder} party={getPartyDetails(selectedOrder.partyName)} />
                                </div>
                            )}

                            {(activeTab === 'packing' || activeTab === 'full') && (
                                <div className={`${activeTab === 'full' ? 'print-page-break' : ''} print:block relative`}>
                                    <PackingSlipTemplate order={selectedOrder} party={getPartyDetails(selectedOrder.partyName)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportManage;
