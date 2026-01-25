import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import OrderTrendsChart from '../components/OrderTrendsChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';

const Dashboard = () => {
  const [orderStats, setOrderStats] = useState({
    queuedOrders: 17,
    inProgressOrders: 20,
    completedOrders: 0,
  });

  const handleViewMoreOrders = (status) => {
    console.log(`View more orders for: ${status}`);
    // Will navigate to orders page with filters
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
      {/* Statistics Grid - Responsive with max-width */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="IN QUEUE (NEW)"
            count={orderStats.queuedOrders}
            status="Pending Processing"
            statusColor="bg-orange-100 text-orange-700"
            onViewMore={() => handleViewMoreOrders('queued')}
          />
          <StatCard
            title="IN PROGRESS"
            count={orderStats.inProgressOrders}
            status="Active Production"
            statusColor="bg-blue-100 text-blue-700"
            onViewMore={() => handleViewMoreOrders('inProgress')}
          />
        </div>

        {/* Main Content Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
          {/* Left Column - Full Width on Mobile */}
          <div className="lg:col-span-2">
            <OrderTrendsChart />
          </div>

          {/* Right Column - QuickActions only */}
          <div className="space-y-6">
            <QuickActions />
          </div>

          {/* Second row: RecentActivity spans two columns (under the chart) to fill empty space */}
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>

          {/* Right-side spacer for layout balance (keeps grid consistent) */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
