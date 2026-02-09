import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.98.94.149:5001';

const OrderTrendsChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchTrend = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('user');
        const userObj = storedUser ? JSON.parse(storedUser) : null;
        const role = userObj ? userObj.role : null;
        const response = await axios.get(`${API_URL}/api/stats/dashboard-trend?timeframe=${timeframe}`, {
          headers: { 'x-user-role': role }
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [timeframe]);

  if (loading && data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm font-medium animate-pulse text-center">
          Analysing production cycles...
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.inProgress, d.newQueue)), 5);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Production Velocity</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Cycle Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="week">1 Week Back</option>
            <option value="month">1 Month Back</option>
            <option value="year">1 Year Progress</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 lg:gap-6 justify-around mb-8 h-48 px-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 min-w-0 group relative">
              <div className="flex items-end gap-1 sm:gap-1.5 h-40 mb-3 w-full justify-center">
                {/* In Progress Bar */}
                <div
                  className="flex-1 max-w-[12px] bg-indigo-500 rounded-t-sm transition-all duration-300 group-hover:bg-indigo-600 relative overflow-hidden"
                  style={{ height: `${(item.inProgress / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
                {/* New/Queue Bar */}
                <div
                  className="flex-1 max-w-[12px] bg-blue-300 rounded-t-sm transition-all duration-300 group-hover:bg-blue-400 relative overflow-hidden"
                  style={{ height: `${(item.newQueue / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                </div>
              </div>

              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-900 text-white text-[9px] py-1.5 px-2.5 rounded shadow-xl transition-opacity pointer-events-none z-10 whitespace-nowrap font-bold">
                Progress: {item.inProgress} | New: {item.newQueue}
              </div>

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-full">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 pt-5 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Moved To Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-300 rounded-sm" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">New Job Entry</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrendsChart;
