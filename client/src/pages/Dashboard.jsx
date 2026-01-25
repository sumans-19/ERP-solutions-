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
    <main className="flex-1 overflow-y-auto pt-3 sm:pt-4 pb-6 sm:pb-8 px-3 sm:px-4 lg:px-6 bg-slate-50">
      {/* Statistics Grid - Responsive with max-width */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6 lg:mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 auto-rows-max">
          {/* Left Column - Full Width on Mobile */}
          <div className="lg:col-span-2">
            <OrderTrendsChart />
          </div>

          {/* Right Column - QuickActions only */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
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
