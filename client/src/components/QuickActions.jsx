import React from 'react';
import { FileText, CreditCard, Users } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      id: 'invoice',
      label: 'Create Invoice',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      id: 'purchaseBill',
      label: 'Add Purchase Bill',
      icon: CreditCard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'party',
      label: 'Add New Party',
      icon: Users,
      color: 'text-slate-500',
      bgColor: 'bg-slate-50 hover:bg-slate-100',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
      {/* Icon/Illustration */}
      <div className="text-center mb-4">
        <div className="inline-block p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-3">
          <span className="text-2xl sm:text-3xl">🚀</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Quick Actions</h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">Manage your business efficiently with shortcuts.</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition duration-200 ${action.bgColor}`}
            >
              <IconComponent className={`${action.color} flex-shrink-0`} size={18} />
              <span className="text-sm font-medium text-slate-900 text-left truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
