import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

const Header = ({ onLogout, onMenuToggle, user = {} }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        {/* Left Section - Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
            Welcome to Elints
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Logged in as: <span className="font-medium">{user?.role || 'User'}</span> | {user?.email || 'user@email.com'}
          </p>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 ml-3 sm:ml-4 flex-shrink-0">
          <button className="hidden md:flex px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200 whitespace-nowrap">
            + Create Order
          </button>

          <button 
            onClick={onLogout}
            className="hidden md:flex px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 border border-red-500 text-red-500 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-50 transition duration-200 items-center gap-1 whitespace-nowrap">
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            {isMobileMenuOpen ? (
              <X size={18} className="text-slate-600" />
            ) : (
              <Menu size={18} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="p-3 space-y-2">
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              + Create Order
            </button>
            <button
              onClick={onLogout}
              className="w-full px-3 py-2 border border-red-500 text-red-500 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-1"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
