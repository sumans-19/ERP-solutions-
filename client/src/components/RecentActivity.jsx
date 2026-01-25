import React from 'react';
import { ExternalLink } from 'lucide-react';

const RecentActivity = () => {
  const activities = []; // Will be populated from backend

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Recent Activity</h3>
        <a href="#" className="text-xs sm:text-sm text-blue-600 font-medium hover:text-blue-700 transition flex items-center gap-1 flex-shrink-0">
          <span className="hidden sm:inline">View All</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Empty State */}
      {activities.length === 0 ? (
        <div className="text-center py-4 sm:py-6">
          <p className="text-xs sm:text-sm text-slate-500">No recent transactions found.</p>
          <p className="text-xs text-slate-400 mt-2">Activities will appear here as you process orders and transactions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
              <p className="text-sm font-medium text-slate-900">{activity.title}</p>
              <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
