import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import OrderTrendsChart from '../components/OrderTrendsChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState({
    queuedOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
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
        setOrderStats({
          queuedOrders: response.data.newOrders,
          inProgressOrders: response.data.inProgress,
          completedOrders: response.data.items - (response.data.newOrders + response.data.inProgress) // Rough estimate or handle specifically
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleViewMoreOrders = (status) => {
    console.log(`View more orders for: ${status}`);
    // Will navigate to orders page with filters
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="IN QUEUE (NEW)"
            count={loading ? '...' : orderStats.queuedOrders}
            status="Pending Processing"
            statusColor="bg-orange-100 text-orange-700"
            onViewMore={() => handleViewMoreOrders('queued')}
          />
          <StatCard
            title="IN PROGRESS"
            count={loading ? '...' : orderStats.inProgressOrders}
            status="Active Production"
            statusColor="bg-blue-100 text-blue-700"
            onViewMore={() => handleViewMoreOrders('inProgress')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
          <div className="lg:col-span-2">
            <OrderTrendsChart />
          </div>

          <div className="space-y-6">
            <QuickActions />
          </div>

          <div className="lg:col-span-3">
            <RecentActivity />
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;

