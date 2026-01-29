import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShoppingCart, Package, Users, Clock, AlertTriangle,
    CheckCircle2, TrendingUp, Calendar, ArrowRight,
    Briefcase, Truck, Activity, MoreVertical, Search, ChevronDown,
    Banknote, TrendingDown, Factory, AlertOctagon, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrderStageGate from './Orders/OrderStageGate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- New Component Design ---

const DashboardMetric = ({ title, value, icon: Icon, color, onClick, isExpanded, subtext }) => (
    <motion.div
        layout
        onClick={onClick}
        className={`bg-white rounded-md border border-slate-200 p-4 cursor-pointer relative overflow-hidden group transition-all duration-200 hover:border-blue-400 hover:shadow-sm ${isExpanded ? `ring-1 ring-${color}-500 border-${color}-500 bg-${color}-50/10` : ''
            }`}
    >
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                    {subtext && <span className="text-[10px] font-medium text-slate-400">{subtext}</span>}
                </div>
            </div>
            <div className={`p-2 rounded bg-slate-50 text-slate-500 group-hover:text-${color}-600 group-hover:bg-${color}-50 transition-colors`}>
                <Icon size={20} />
            </div>
        </div>

        <div className={`mt-3 pt-3 border-t border-slate-100 flex items-center text-[10px] font-semibold text-slate-400 group-hover:text-${color}-600 transition-colors`}>
            {isExpanded ? 'COLLAPSE DETAILS' : 'VIEW DETAILS'} <ChevronDown size={12} className={`ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
    </motion.div>
);

const DetailPanel = ({ title, children, color }) => (
    <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden"
    >
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                {title}
            </h3>
        </div>
        <div className="p-5">
            {children}
        </div>
    </motion.div>
);

const SectionHeader = ({ title, icon: Icon, action }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {Icon && <Icon size={18} className="text-slate-400" />}
            {title}
        </h2>
        {action}
    </div>
);

const AdminDashboard = ({ setActiveSection }) => {
    const [expandedSection, setExpandedSection] = useState(null);
    const [data, setData] = useState({
        orders: [],
        jobs: [],
        processStats: {},
        inventory: {
            lowStock: [],
            pendingRequestsItems: [],
            totalItems: 0
        },
        employees: { total: 0, active: 0, busy: 0 },
        timeline: [],
        recentActivity: [],
        revenue: { total: 0, potential: 0 },
        topClients: [],
        bottleneck: { stage: 'None', count: 0 },
        bulletins: [],
        tasks: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const fetchResults = await Promise.allSettled([
                axios.get(`${API_URL}/api/orders`),
                axios.get(`${API_URL}/api/raw-materials`),
                axios.get(`${API_URL}/api/material-requests`),
                axios.get(`${API_URL}/api/employees`),
                axios.get(`${API_URL}/api/job-cards`),
                axios.get(`${API_URL}/api/bulletins`),
                axios.get(`${API_URL}/api/tasks`)
            ]);

            const orders = fetchResults[0].status === 'fulfilled' ? fetchResults[0].value.data : [];
            const rawMaterials = fetchResults[1].status === 'fulfilled' ? fetchResults[1].value.data : [];
            const matRequests = fetchResults[2].status === 'fulfilled' ? fetchResults[2].value.data : [];
            const employees = fetchResults[3].status === 'fulfilled' ? fetchResults[3].value.data : [];
            const jobs = fetchResults[4].status === 'fulfilled' ? fetchResults[4].value.data : [];
            const bulletins = fetchResults[5].status === 'fulfilled' ? fetchResults[5].value.data : [];
            const tasks = fetchResults[6].status === 'fulfilled' ? fetchResults[6].value.data : [];

            // --- 1. Process & Job Stats ---
            const processStats = {};
            jobs.forEach(job => {
                if (job.status === 'InProgress' && job.steps) {
                    job.steps.forEach(step => {
                        if (step.status === 'in-progress' || step.status === 'pending') {
                            processStats[step.stepName] = (processStats[step.stepName] || 0) + 1;
                        }
                    });
                }
            });

            // --- 2. Inventory Stats ---
            const lowStock = rawMaterials.filter(m => (m.qty || 0) < 50).sort((a, b) => a.qty - b.qty).slice(0, 5);

            // --- 3. Employee Stats & Job Map ---
            const activeEmps = employees.filter(e => e.status === 'Active');

            const employeeJobMap = {};
            jobs.forEach(j => {
                if (j.status !== 'Completed' && j.steps) {
                    j.steps.forEach(s => {
                        if ((s.status === 'in-progress' || s.status === 'pending') && s.employeeId) {
                            if (s.status === 'in-progress' || !employeeJobMap[s.employeeId]) {
                                employeeJobMap[s.employeeId] = j.jobNumber;
                            }
                        }
                    });
                }
            });

            // --- 4. Timeline & Activity ---
            const today = new Date();
            const tenDaysLater = new Date();
            tenDaysLater.setDate(today.getDate() + 10);

            const upcomingOrders = orders.filter(o => {
                const d = new Date(o.estimatedDeliveryDate);
                return d >= today && d <= tenDaysLater && o.status !== 'Completed';
            }).sort((a, b) => new Date(a.estimatedDeliveryDate) - new Date(b.estimatedDeliveryDate));

            const recentActivity = jobs
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
                .map(j => ({
                    id: j._id,
                    desc: `${j.itemId?.name || 'Item'} - ${j.stage}`,
                    time: j.updatedAt,
                    status: j.status
                }));

            // --- 5. Business Intelligence ---

            // Revenue
            const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? (o.totalAmount || 0) : 0), 0);
            const potentialRevenue = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            // Top Clients
            const clientCounts = {};
            orders.forEach(o => { if (o.status !== 'Cancelled') clientCounts[o.partyName] = (clientCounts[o.partyName] || 0) + 1; });
            const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => ({ name, count }));

            // Bottleneck
            const stageLoad = {};
            jobs.forEach(j => { if (j.status === 'InProgress') stageLoad[j.stage] = (stageLoad[j.stage] || 0) + 1; });
            const bottleneckEntry = Object.entries(stageLoad).sort((a, b) => b[1] - a[1])[0];
            const bottleneck = bottleneckEntry ? { stage: bottleneckEntry[0], count: bottleneckEntry[1] } : { stage: 'None', count: 0 };


            setData({
                orders,
                jobs,
                processStats,
                inventory: {
                    lowStock,
                    pendingRequestsItems: matRequests.filter(m => m.status === 'Pending'),
                    totalItems: rawMaterials.length
                },
                employees: {
                    total: employees.length,
                    active: activeEmps.length,
                    busy: activeEmps.filter(e => e.calculatedStatus === 'Busy').length,
                    details: {
                        active: activeEmps,
                        busy: activeEmps.filter(e => e.calculatedStatus === 'Busy')
                    },
                    jobMap: employeeJobMap
                },
                timeline: upcomingOrders,
                recentActivity,
                revenue: { total: totalRevenue, potential: potentialRevenue },
                topClients,
                bottleneck,
                bulletins,
                tasks
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium text-xs">Loading Dashboard...</p>
            </div>
        </div>
    );

    const toggleExpand = (section) => setExpandedSection(expandedSection === section ? null : section);

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
                        <p className="text-slate-500 text-xs mt-1 font-medium">REAL-TIME OPERATIONAL INTELLIGENCE</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white px-3 py-1.5 rounded border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <button onClick={fetchDashboardData} className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
                            <Activity size={16} />
                        </button>
                    </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardMetric
                        title="Active Orders"
                        value={data.orders.filter(o => o.status !== 'Completed').length}
                        icon={ShoppingCart}
                        color="blue"
                        subtext="LIVE TRACKING"
                        isExpanded={expandedSection === 'orders'}
                        onClick={() => toggleExpand('orders')}
                    />

                    <DashboardMetric
                        title="In-Process Jobs"
                        value={data.jobs.filter(j => j.status === 'InProgress').length}
                        icon={Activity}
                        color="amber"
                        subtext="SHOP FLOOR"
                        isExpanded={expandedSection === 'process'}
                        onClick={() => toggleExpand('process')}
                    />

                    <DashboardMetric
                        title="Inventory Items"
                        value={data.inventory.totalItems}
                        icon={Package}
                        color="purple"
                        subtext={`${data.inventory.lowStock.length} ALERTS`}
                        isExpanded={expandedSection === 'inventory'}
                        onClick={() => toggleExpand('inventory')}
                    />

                    <DashboardMetric
                        title="Workforce Pulse"
                        value={`${data.employees.busy} / ${data.employees.active}`}
                        icon={Users}
                        color="emerald"
                        subtext="UTILIZATION"
                        isExpanded={expandedSection === 'employees'}
                        onClick={() => toggleExpand('employees')}
                    />
                </div>

                {/* Expanded Details Section - Renders dynamically based on selection */}
                <AnimatePresence>
                    {expandedSection === 'orders' && (
                        <DetailPanel title="Live Order Tracking" color="blue">
                            <OrderStageGate />
                            <div className="mt-4 text-center">
                                <button onClick={() => setActiveSection('admin-orders')} className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">
                                    View Detailed Order Board &rarr;
                                </button>
                            </div>
                        </DetailPanel>
                    )}

                    {expandedSection === 'process' && (
                        <DetailPanel title="Production Process Breakdown" color="amber">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {Object.keys(data.processStats).length > 0 ? (
                                    Object.entries(data.processStats).map(([process, count]) => (
                                        <div key={process} className="bg-white rounded border border-slate-200 p-3 hover:border-amber-300 transition-colors flex flex-col items-center text-center shadow-sm">
                                            <span className="text-xl font-bold text-slate-800">{count}</span>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">{process}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-slate-400 py-4 text-sm">No active processes currently tracked.</div>
                                )}
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <button onClick={() => setActiveSection('admin-process')} className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                                    Manage Processes <ArrowRight size={12} />
                                </button>
                            </div>
                        </DetailPanel>
                    )}

                    {expandedSection === 'inventory' && (
                        <DetailPanel title="Inventory Health Check" color="purple">
                            <div className="overflow-x-auto border border-slate-200 rounded-md">
                                <table className="w-full text-left text-xs bg-white">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2.5">Item Name</th>
                                            <th className="px-4 py-2.5 text-center">Stock Level</th>
                                            <th className="px-4 py-2.5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.inventory.lowStock.map(item => (
                                            <tr key={item._id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-800 border-r border-slate-50">{item.name}</td>
                                                <td className="px-4 py-2 text-center font-bold border-r border-slate-50">{item.qty} {item.uom}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-red-100">Critical</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.inventory.lowStock.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-center text-slate-400">Inventory levels are healthy.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </DetailPanel>
                    )}

                    {expandedSection === 'employees' && (
                        <DetailPanel title="Workforce Activity & Assignments" color="emerald">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Busy Employees */}
                                <div className="bg-white rounded-md p-3 border border-emerald-100">
                                    <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex justify-between items-center border-b border-emerald-50 pb-2">
                                        <span>On Active Jobs ({data.employees.busy})</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">LIVE</span>
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                        {data.employees.details?.busy.map(e => (
                                            <div key={e._id} className="flex items-center gap-2 p-2 bg-emerald-50/30 rounded border border-emerald-100/50">
                                                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                                                    {e.firstName?.[0] || e.fullName?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{e.fullName}</p>
                                                    <p className="text-[10px] text-slate-500">{e.designation}</p>
                                                </div>
                                                {data.employees.jobMap[e._id] && (
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">Job #{data.employees.jobMap[e._id]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Task Assignments */}
                                <div className="bg-white rounded-md p-3 border border-blue-100">
                                    <h4 className="font-bold text-slate-700 text-xs uppercase mb-3 flex justify-between items-center border-b border-blue-50 pb-2">
                                        <span>Total Open Tasks ({data.tasks.filter(t => t.status !== 'Completed').length})</span>
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                        {data.tasks.filter(t => t.status !== 'Completed').slice(0, 5).map(task => (
                                            <div key={task._id} className="p-2 bg-blue-50/30 rounded border border-blue-100/50">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.title}</p>
                                                    <span className={`text-[10px] px-1.5 rounded font-bold ${task.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-slate-500">To: {task.employeeId?.name || 'Staff'}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {data.tasks.filter(t => t.status !== 'Completed').length === 0 && (
                                            <p className="text-xs text-slate-500 italic text-center py-4">No pending tasks.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DetailPanel>
                    )}
                </AnimatePresence>

                {/* Secondary Metrics Row - Business Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Revenue Insight */}
                    <div className="bg-white rounded-md border border-slate-200 p-4 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pipeline Revenue</p>
                                <h3 className="text-xl font-bold text-slate-800 mt-1">₹{data.revenue.potential.toLocaleString()}</h3>
                            </div>
                            <div className="p-1.5 bg-green-50 text-green-600 rounded">
                                <Banknote size={16} />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mb-2">
                            <div className="bg-green-600 h-1 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">LIFETIME: ₹{data.revenue.total.toLocaleString()}</p>
                    </div>

                    {/* Top Clients */}
                    <div className="bg-white rounded-md border border-slate-200 p-4 hover:border-blue-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                                Key Accounts
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {data.topClients.map((client, i) => (
                                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                    <span className="text-slate-700 font-semibold truncate max-w-[150px]">{client.name}</span>
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{client.count} Orders</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottleneck Alert */}
                    <div className="bg-white rounded-md border border-slate-200 p-4 hover:border-red-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Bottleneck</p>
                                <h3 className="text-lg font-bold text-red-600 mt-1">{data.bottleneck.stage}</h3>
                            </div>
                            <div className="p-1.5 bg-red-50 text-red-600 rounded animate-pulse">
                                <AlertOctagon size={16} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">
                            <span className="font-bold">{data.bottleneck.count}</span> jobs stalled in stage.
                        </p>
                        <button onClick={() => setActiveSection('admin-process')} className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline uppercase tracking-wide">
                            Resolve Issues &rarr;
                        </button>
                    </div>
                </div>

                {/* Secondary Content: Timeline & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Timeline */}
                    <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
                        <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                                <Calendar size={16} className="text-slate-400" /> Production Timeline
                            </h3>
                            <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded">NEXT 10 DAYS</span>
                        </div>
                        <div className="p-4 space-y-2">
                            {data.timeline.length > 0 ? (
                                data.timeline.map((order) => (
                                    <div key={order._id} className="flex items-center gap-4 p-2.5 rounded border border-slate-100 hover:border-blue-300 hover:bg-white transition-all group bg-slate-50/30">
                                        <div className="w-10 h-10 rounded bg-white border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-blue-200 transition-colors">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-blue-500 leading-none mb-0.5">{new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 leading-none">{new Date(order.estimatedDeliveryDate).getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{order.partyName}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono">PO: {order.poNumber}</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${order.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {order.priority}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">No upcoming deliveries scheduled.</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Global Bulletins Widget */}
                        <div className="bg-slate-800 rounded-md shadow-sm text-white p-4 relative overflow-hidden border border-slate-700">
                            <h3 className="font-bold flex items-center gap-2 mb-3 relative z-10 text-xs uppercase tracking-widest text-slate-400">
                                <Activity size={14} /> Bulletins
                            </h3>
                            <div className="space-y-2 relative z-10">
                                {data.bulletins.slice(0, 3).map((bull, i) => (
                                    <div key={bull._id || i} className="bg-slate-700/50 p-2.5 rounded border border-slate-600 hover:bg-slate-700 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-xs text-slate-200">{bull.title}</h4>
                                            {bull.priority === 'High' && <span className="bg-red-500/20 text-red-400 border border-red-500/50 text-[9px] px-1.5 rounded font-bold">URGENT</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{bull.content}</p>
                                    </div>
                                ))}
                                {data.bulletins.length === 0 && (
                                    <div className="text-center py-4 text-slate-500 text-xs italic">
                                        No active announcements.
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setActiveSection('admin-communication')} className="w-full mt-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold transition-colors uppercase tracking-wide border border-slate-600">
                                Communication Hub
                            </button>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
                            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Activity size={16} className="text-slate-400" /> Live Feed
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4 relative ml-1.5">
                                    <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200"></div>
                                    {data.recentActivity.map((act, i) => (
                                        <div key={i} className="relative pl-5">
                                            <div className="absolute left-[-2.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-white border border-blue-500"></div>
                                            <p className="text-xs font-medium text-slate-700 line-clamp-2">{act.desc}</p>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-[10px] text-slate-400 font-mono">{new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <span className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 px-1 rounded">{act.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {data.recentActivity.length === 0 && <p className="text-center text-slate-400 text-xs pl-4">No recent activity.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    );
};

export default AdminDashboard;

