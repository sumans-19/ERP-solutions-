import React from 'react';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';

const SummaryStats = () => {
  const stats = [
    {
      id: 'avgValue',
      label: 'Avg Order Value',
      value: '₹2,450',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 'completion',
      label: 'Completion Rate',
      value: '87%',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'avgTime',
      label: 'Avg Processing',
      value: '2.5h',
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Summary</h3>
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.id} className={`flex items-center gap-3 p-3 rounded-lg ${stat.bgColor}`}>
              <div className={`p-2 rounded-lg ${stat.bgColor} border border-slate-200`}>
                <IconComponent className={`${stat.color}`} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600">
                  {stat.label}
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryStats;
