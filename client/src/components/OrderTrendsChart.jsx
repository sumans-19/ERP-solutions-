import React, { useState } from 'react';

const OrderTrendsChart = () => {
  const [timeframe, setTimeframe] = useState('month');

  const mockChartData = [
    { label: 'Week 1', inProgress: 5, newQueue: 3 },
    { label: 'Week 2', inProgress: 8, newQueue: 5 },
    { label: 'Week 3', inProgress: 6, newQueue: 4 },
    { label: 'Week 4', inProgress: 12, newQueue: 8 },
  ];

  const maxValue = Math.max(...mockChartData.map(d => Math.max(d.inProgress, d.newQueue)));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Order Trends</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs sm:text-sm px-3 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Simple Bar Chart */}
      <div className="flex items-end gap-2 sm:gap-3 lg:gap-4 justify-around mb-5 h-48">
        {mockChartData.map((data, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-end gap-1 sm:gap-1.5 h-40 mb-2 w-full justify-center">
              {/* In Progress Bar */}
              <div
                className="flex-1 max-w-3 sm:max-w-4 bg-blue-500 rounded-t transition hover:bg-blue-600"
                style={{ height: `${(data.inProgress / maxValue) * 100}%` }}
                title={`In Progress: ${data.inProgress}`}
              />
              {/* New/Queue Bar */}
              <div
                className="flex-1 max-w-3 sm:max-w-4 bg-orange-500 rounded-t transition hover:bg-orange-600"
                style={{ height: `${(data.newQueue / maxValue) * 100}%` }}
                title={`New/Queue: ${data.newQueue}`}
              />
            </div>
            <p className="text-xs font-medium text-slate-600 text-center">{data.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-4 border-t border-slate-200 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
          <span className="text-xs sm:text-sm text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
          <span className="text-xs sm:text-sm text-slate-600">New / In Queue</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrendsChart;
