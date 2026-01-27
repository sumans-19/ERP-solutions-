import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package, Activity, ShoppingCart, Users, TrendingUp, Clock, CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AdminDashboard = ({ setActiveSection }) => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        inProgress: 0,
        completed: 0,
        totalItems: 0,
        totalParties: 0,
        totalEmployees: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRealStats();
    }, []);

    const fetchRealStats = async () => {
        try {
            const [ordersRes, itemsRes, partiesRes, employeesRes] = await Promise.all([
                axios.get(`${API_URL}/api/orders`),
                axios.get(`${API_URL}/api/items`),
                axios.get(`${API_URL}/api/parties`),
                axios.get(`${API_URL}/api/employees`)
            ]);

            const orders = ordersRes.data || [];
            const inProgressOrders = orders.filter(o =>
                o.status && !['completed', 'delivered', 'cancelled'].includes(o.status.toLowerCase())
            );
            const completedOrders = orders.filter(o =>
                o.status && ['completed', 'delivered'].includes(o.status.toLowerCase())
            );

            setStats({
                totalOrders: orders.length,
                inProgress: inProgressOrders.length,
                completed: completedOrders.length,
                totalItems: itemsRes.data?.length || 0,
                totalParties: partiesRes.data?.length || 0,
                totalEmployees: employeesRes.data?.length || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingCart,
            onClick: () => setActiveSection('admin-orders')
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: Activity,
            onClick: () => setActiveSection('admin-process')
        },
        {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            onClick: () => setActiveSection('admin-orders')
        },
        {
            label: 'Total Items',
            value: stats.totalItems,
            icon: Package,
            onClick: () => setActiveSection('admin-items')
        },
        {
            label: 'Parties',
            value: stats.totalParties,
            icon: Users,
            onClick: () => setActiveSection('admin-parties')
        },
        {
            label: 'Employees',
            value: stats.totalEmployees,
            icon: Users,
            onClick: () => setActiveSection('admin-users')
        }
    ];

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
                    <p className="text-slate-600">System overview and quick access</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {statCards.map((stat, idx) => (
                        <button
                            key={idx}
                            onClick={stat.onClick}
                            className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <stat.icon className="text-slate-400 group-hover:text-blue-600 transition-colors" size={24} />
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    {stat.label}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900">
                                {loading ? '...' : stat.value}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => setActiveSection('admin-comm-hub')}
                            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                        >
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                Communication Hub
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Send messages & bulletins</p>
                        </button>
                        <button
                            onClick={() => setActiveSection('admin-tasks-list')}
                            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                        >
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                Employee Tasks
                            </p>
                            <p className="text-xs text-slate-500 mt-1">View all assignments</p>
                        </button>
                        <button
                            onClick={() => setActiveSection('admin-inventory-dash')}
                            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                        >
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                Inventory
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Check stock levels</p>
                        </button>
                        <button
                            onClick={() => setActiveSection('admin-process')}
                            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                        >
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                Process Management
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Manage workflows</p>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AdminDashboard;
