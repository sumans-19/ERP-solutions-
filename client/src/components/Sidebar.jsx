import React from 'react';
import { X } from 'lucide-react';

const Sidebar = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-slate-400 text-sm">Navigation menu</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
