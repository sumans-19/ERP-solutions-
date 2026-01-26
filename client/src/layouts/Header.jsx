import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

const Header = ({ onLogout, onMenuToggle, user = {} }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section - Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome to Elints
          </h1>
          <p className="text-sm text-slate-500 hidden sm:block">
            Logged in as: <span className="font-semibold">{user?.role || 'User'}</span>
          </p>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <button className="hidden md:flex px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition duration-200 whitespace-nowrap shadow-sm">
            + Create Order
          </button>

          <button
            onClick={onLogout}
            className="hidden md:flex px-4 py-2 border border-red-400 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition duration-200 items-center gap-2 whitespace-nowrap">
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
          >
            {isMobileMenuOpen ? (
              <X size={20} className="text-slate-600" />
            ) : (
              <Menu size={20} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="p-4 space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              + Create Order
            </button>
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 border border-red-400 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
