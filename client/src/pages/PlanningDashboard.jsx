import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Activity, ShoppingCart, ChevronRight, Users, UserCheck, AlertCircle } from 'lucide-react';
import OrderTrendsChart from '../components/OrderTrendsChart';
import { canRead } from '../utils/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PlanningDashboard = ({ setActiveSection }) => {
    const [stats, setStats] = useState({
        parties: 0,
        employees: 0,
        orders: 0,
        items: 0,
        inManufacturing: 0,
        onHold: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const userObj = storedUser ? JSON.parse(storedUser) : null;
                const role = userObj ? userObj.role : null;

                const response = await axios.get(`${API_URL}/api/stats/planning-stats`, {
                    headers: { 'x-user-role': role }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const actions = [
        {
            id: 'items',
            label: 'Item Manage',
            description: 'Create and manage item specifications and bills of materials.',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            id: 'process',
            label: 'Process Manage',
            description: 'Track manufacturing steps and monitor production progress.',
            icon: Activity,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            id: 'orders',
            label: 'Order Manage',
            description: 'Create, edit, and track customer purchase orders.',
            icon: ShoppingCart,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        }
    ].filter(a => canRead(a.id));

    const statItems = [
        { label: 'New Orders', value: stats.newOrders, icon: ShoppingCart, color: 'text-blue-600', isPrimary: true },
        { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-indigo-600', isPrimary: true },
        { label: 'Items', value: stats.items, icon: Package, color: 'text-orange-600' },
        { label: 'Parties', value: stats.parties, icon: Users, color: 'text-slate-600' },
        { label: 'Employees', value: stats.employees, icon: UserCheck, color: 'text-purple-600' },
        { label: 'On Hold', value: stats.onHold, icon: AlertCircle, color: 'text-red-600' }
    ];

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Planning Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time operational overview and module access</p>
                </div>

                {/* Stats Summary Box */}
                <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 whitespace-nowrap">Operational Overview</h2>
                        <div className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full uppercase tracking-wider ml-4">
                            Real-time
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
                        {statItems.map((stat, idx) => (
                            <div key={idx} className={`${idx !== statItems.length - 1 ? 'lg:border-r border-slate-100' : ''} pr-4 ${stat.isPrimary ? 'bg-slate-50/50 -m-2 p-2 rounded-md border border-slate-100' : ''}`}>
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <stat.icon size={14} className={stat.color} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${stat.isPrimary ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {loading ? '...' : stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trend Chart Area */}
                <div className="mb-8">
                    <OrderTrendsChart />
                </div>

                {/* Action Modules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {actions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className="bg-white rounded-md border border-slate-200 p-6 shadow-sm hover:shadow-md transition duration-200 text-left group"
                        >
                            <div className={`${item.bgColor} ${item.color} w-12 h-12 rounded-md flex items-center justify-center mb-4`}>
                                <item.icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.label}</h3>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed h-10 overflow-hidden text-ellipsis">
                                {item.description}
                            </p>
                            <div className="flex items-center text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
                                Access Module <ChevronRight size={16} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlanningDashboard;

