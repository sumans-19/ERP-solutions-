import React from 'react';

const StatCard = ({ title, count, status, statusColor, onViewMore }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex items-start justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-medium text-slate-600 flex-1">{title}</h3>
        <span className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-3xl sm:text-4xl font-bold text-slate-900">{count}</p>
      </div>

      {/* This div will be populated from backend */}
      <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-3">
        <p className="mb-2">Recent Items</p>
        <button
          onClick={onViewMore}
          className="text-blue-600 font-medium text-xs hover:text-blue-700 transition flex items-center gap-1"
        >
          <span>View Orders (10)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default StatCard;
