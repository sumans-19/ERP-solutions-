import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Printer, Search, Filter,
    Factory, Users, ShoppingBag, Box, ClipboardCheck,
    Calendar, ChevronDown, Download
} from 'lucide-react';
import {
    getAllOrders, getAllParties, getAllItems,
    getJobCards, getAllEmployees
} from '../services/api';
import ReportCompanyHeader from '../components/ReportCompanyHeader';

const ReportManage = () => {
    // --- State Management ---
    const [reportType, setReportType] = useState('mfg'); // mfg, emp, po, item, job
    const [data, setData] = useState({
        orders: [],
        parties: [],
        items: [],
        jobCards: [],
        employees: []
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        selectedId: '', // Generic ID for Employee, Item, specific Job, or PO
        search: ''
    });
    const [loading, setLoading] = useState(true);
    const componentRef = useRef();

    // --- Initial Data Load ---
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [orders, parties, items, jobCards, employees] = await Promise.all([
                getAllOrders(),
                getAllParties(),
                getAllItems(),
                getJobCards(),
                getAllEmployees()
            ]);
            setData({ orders, parties, items, jobCards, employees });
        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Report Logic & Generators ---

    const getFilteredData = () => {
        let filtered = [];

        // Date Logic
        const isInRange = (date) => {
            if (!date) return false;
            const d = new Date(date);
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        };

        switch (reportType) {
            case 'mfg': // Manufacturing Report (All Jobs)
                filtered = data.jobCards.filter(job => {
                    const matchStatus = filters.status ? job.status === filters.status : true;
                    // For jobs, we check createdAt or assignedAt
                    return matchStatus && isInRange(job.createdAt);
                });
                break;

            case 'emp': // Employee Activity
                // Flatten job steps to find employee assignments
                if (!filters.selectedId) return [];
                data.jobCards.forEach(job => {
                    if (job.steps) {
                        job.steps.forEach(step => {
                            if (step.employeeId === filters.selectedId || (step.employeeId?._id === filters.selectedId)) {
                                if (isInRange(step.assignedAt || job.createdAt)) {
                                    filtered.push({
                                        jobId: job._id,
                                        jobNumber: job.jobNumber,
                                        itemName: job.itemId?.name,
                                        itemCode: job.itemId?.code,
                                        stepName: step.stepName,
                                        status: step.status,
                                        assignedAt: step.assignedAt || job.createdAt,
                                        completedAt: step.endTime
                                    });
                                }
                            }
                        });
                    }
                });
                break;

            case 'po': // PO Status Report
                filtered = data.orders.filter(order => {
                    const matchStatus = filters.status ? order.status === filters.status : true;
                    const matchSearch = filters.search ? order.poNumber.toLowerCase().includes(filters.search.toLowerCase()) : true;
                    return matchStatus && matchSearch && isInRange(order.createdAt);
                });
                break;

            case 'item': // Item Mfg Report
                if (!filters.selectedId) return [];
                filtered = data.jobCards.filter(job => {
                    const matchItem = job.itemId?._id === filters.selectedId || job.itemId === filters.selectedId;
                    return matchItem && isInRange(job.createdAt);
                });
                break;

            case 'job': // Specific Job Report
                if (!filters.search) return [];
                filtered = data.jobCards.filter(job =>
                    job.jobNumber.toLowerCase().includes(filters.search.toLowerCase())
                );
                break;

            default:
                break;
        }
        return filtered;
    };

    const reportData = getFilteredData();

    // --- Templates ---

    // 1. Manufacturing Report Template
    const MfgReportTemplate = () => (
        <table className="w-full text-sm border-collapse border border-slate-300">
            <thead className="bg-slate-100 uppercase text-xs font-bold text-slate-700">
                <tr>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Job Number</th>
                    <th className="border p-2">Item Details</th>
                    <th className="border p-2 text-center">Qty</th>
                    <th className="border p-2">Stage</th>
                    <th className="border p-2">Status</th>
                </tr>
            </thead>
            <tbody>
                {reportData.map((row, i) => (
                    <tr key={i} className="even:bg-slate-50">
                        <td className="border p-2 text-center">{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td className="border p-2 font-mono font-bold">{row.jobNumber}</td>
                        <td className="border p-2">
                            <div className="font-bold text-slate-800">{row.itemId?.name}</div>
                            <div className="text-xs text-slate-500">{row.itemId?.code}</div>
                        </td>
                        <td className="border p-2 text-center font-bold">{row.quantity}</td>
                        <td className="border p-2">{row.stage}</td>
                        <td className="border p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // 2. Employee Activity Template
    const EmpReportTemplate = () => {
        const emp = data.employees.find(e => e._id === filters.selectedId);
        return (
            <div>
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded">
                    <p className="font-bold text-lg text-slate-800">{emp?.fullName || 'Unknown Employee'}</p>
                    <p className="text-sm text-slate-500">ID: {emp?.employeeId} | Role: {emp?.role}</p>
                </div>
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="bg-slate-100 uppercase text-xs font-bold text-slate-700">
                        <tr>
                            <th className="border p-2">Date Assigned</th>
                            <th className="border p-2">Job Number</th>
                            <th className="border p-2">Task / Step</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Completion Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, i) => (
                            <tr key={i} className="even:bg-slate-50">
                                <td className="border p-2 text-center">{new Date(row.assignedAt).toLocaleDateString()}</td>
                                <td className="border p-2 font-mono">{row.jobNumber}</td>
                                <td className="border p-2 font-medium">{row.stepName}</td>
                                <td className="border p-2 text-center capitalize">{row.status}</td>
                                <td className="border p-2 text-center">
                                    {row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // 3. PO Status Template
    const POReportTemplate = () => (
        <table className="w-full text-sm border-collapse border border-slate-300">
            <thead className="bg-slate-100 uppercase text-xs font-bold text-slate-700">
                <tr>
                    <th className="border p-2">PO Date</th>
                    <th className="border p-2">PO Number</th>
                    <th className="border p-2">Party Name</th>
                    <th className="border p-2 text-center">Items</th>
                    <th className="border p-2 text-center">Total Qty</th>
                    <th className="border p-2">Current Status</th>
                </tr>
            </thead>
            <tbody>
                {reportData.map((row, i) => (
                    <tr key={i} className="even:bg-slate-50">
                        <td className="border p-2 text-center">{new Date(row.poDate || row.createdAt).toLocaleDateString()}</td>
                        <td className="border p-2 font-mono font-bold">{row.poNumber}</td>
                        <td className="border p-2">{row.partyName}</td>
                        <td className="border p-2 text-center">{row.items?.length || 0}</td>
                        <td className="border p-2 text-center font-bold">{row.totalQty}</td>
                        <td className="border p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${row.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                                }`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // 4. Job / Item Mfg Template (Shared Structure)
    const JobDetailTemplate = () => {
        // Can handle multiple jobs (if Item Report) or single job search
        return (
            <div className="space-y-8">
                {reportData.map((job, i) => (
                    <div key={i} className="border border-slate-300 p-4 rounded-sm break-inside-avoid">
                        <div className="flex justify-between border-b border-slate-200 pb-2 mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">Job: {job.jobNumber}</h3>
                                <p className="text-sm text-slate-500">{job.itemId?.name} ({job.itemId?.code})</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-900">Qty: {job.quantity}</div>
                                <div className="text-xs uppercase bg-slate-100 px-2 py-1 rounded mt-1">{job.status}</div>
                            </div>
                        </div>

                        <div className="text-xs font-bold uppercase text-slate-400 mb-2">Process History</div>
                        <table className="w-full text-xs border border-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border p-1 text-left">Step</th>
                                    <th className="border p-1 text-left">Assigned To</th>
                                    <th className="border p-1 text-center">Start</th>
                                    <th className="border p-1 text-center">End</th>
                                    <th className="border p-1 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {job.steps?.map((step, idx) => (
                                    <tr key={idx}>
                                        <td className="border p-1 font-medium">{step.stepName}</td>
                                        <td className="border p-1 text-slate-600">{
                                            step.employeeId?.fullName ?
                                                step.employeeId.fullName :
                                                (data.employees.find(e => e._id === step.employeeId)?.fullName || 'Unassigned')
                                        }</td>
                                        <td className="border p-1 text-center">{step.startTime ? new Date(step.startTime).toLocaleDateString() : '-'}</td>
                                        <td className="border p-1 text-center">{step.endTime ? new Date(step.endTime).toLocaleDateString() : '-'}</td>
                                        <td className="border p-1 text-center">{step.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        )
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 relative">
            {/* --- Control Bar --- */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 print:hidden shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-2 rounded-md">
                            <FileText size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Reports</h1>
                    </div>

                    {/* Report Type Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-md">
                        {[
                            { id: 'mfg', label: 'Manufacturing', icon: Factory },
                            { id: 'emp', label: 'Emp Activity', icon: Users },
                            { id: 'po', label: 'PO Status', icon: ShoppingBag },
                            { id: 'item', label: 'Item Mfg', icon: Box },
                            { id: 'job', label: 'Job Report', icon: ClipboardCheck }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => { setReportType(type.id); setFilters({ ...filters, selectedId: '', search: '' }); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === type.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <type.icon size={14} />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-bold text-sm">
                    <Printer size={16} /> Print / PDF
                </button>
            </div>

            {/* --- Filters Bar --- */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 print:hidden">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700 mr-2">Filters:</span>

                {/* Date Filters (Common) */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-600"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-600"
                    />
                </div>

                {/* Conditional Filters */}
                {reportType === 'emp' && (
                    <select
                        value={filters.selectedId}
                        onChange={(e) => setFilters(prev => ({ ...prev, selectedId: e.target.value }))}
                        className="border border-slate-300 rounded px-3 py-1 text-sm min-w-[200px]"
                    >
                        <option value="">Select Employee</option>
                        {data.employees.map(e => (
                            <option key={e._id} value={e._id}>{e.fullName}</option>
                        ))}
                    </select>
                )}

                {reportType === 'item' && (
                    <select
                        value={filters.selectedId}
                        onChange={(e) => setFilters(prev => ({ ...prev, selectedId: e.target.value }))}
                        className="border border-slate-300 rounded px-3 py-1 text-sm min-w-[200px]"
                    >
                        <option value="">Select Item</option>
                        {data.items.map(item => (
                            <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                    </select>
                )}

                {(reportType === 'job' || reportType === 'po') && (
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder={reportType === 'job' ? "Search Job No..." : "Search PO No..."}
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-8 pr-3 py-1 border border-slate-300 rounded text-sm w-48 focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                {/* Status Filter (Mfg & PO) */}
                {(reportType === 'mfg' || reportType === 'po') && (
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="border border-slate-300 rounded px-3 py-1 text-sm"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending/New</option>
                        <option value="Processing">Processing/InProgress</option>
                        <option value="Completed">Completed</option>
                    </select>
                )}
            </div>

            {/* --- Report Preview Area --- */}
            <div className="flex-1 overflow-auto p-8 print:p-0 print:bg-white bg-slate-50">
                <div className="bg-white shadow-sm print:shadow-none min-h-[1123px] w-[794px] mx-auto p-8 print:w-full print:h-auto relative">
                    <ReportCompanyHeader />

                    <div className="border-b-2 border-slate-800 pb-2 mb-6 mt-4 flex justify-between items-end">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider text-slate-800">
                                {reportType === 'mfg' && 'Manufacturing Report'}
                                {reportType === 'emp' && 'Employee Activity Report'}
                                {reportType === 'po' && 'PO Status Report'}
                                {reportType === 'item' && 'Item Production History'}
                                {reportType === 'job' && 'Job Card Details'}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold mt-1">
                                Generated on: {new Date().toLocaleString()}
                            </p>
                        </div>
                        {filters.startDate && (
                            <div className="text-right text-xs font-medium text-slate-600">
                                Period: {filters.startDate} to {filters.endDate || 'Today'}
                            </div>
                        )}
                    </div>

                    {reportData.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 italic border border-dashed border-slate-200 rounded">
                            No data found for the selected criteria.
                        </div>
                    ) : (
                        <div className="print:text-black">
                            {reportType === 'mfg' && <MfgReportTemplate />}
                            {reportType === 'emp' && <EmpReportTemplate />}
                            {reportType === 'po' && <POReportTemplate />}
                            {(reportType === 'item' || reportType === 'job') && <JobDetailTemplate />}
                        </div>
                    )}

                    {/* Footer for Report */}
                    <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400 print:fixed print:bottom-4 print:left-8 print:right-8 print:border-none">
                        <div>CONFIDENTIAL - INTERNAL USE ONLY</div>
                        <div>Page 1 of 1</div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; 
                    }
                    body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact !important; 
                    }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { shadow: none !important; }
                    .print\\:w-full { width: 100% !important; }
                    nav, header, aside { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default ReportManage;

