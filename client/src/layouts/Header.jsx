import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';

const Header = ({ onLogout, onMenuToggle, isMobileMenuOpen, user = {}, setActiveSection }) => {
  // Removed local state isMobileMenuOpen to use global sidebar toggle

  const handleCreateItem = () => {
    if (setActiveSection) {
      setActiveSection('items');
      // Append query param to signal ItemPage to open form
      const url = new URL(window.location.href);
      url.searchParams.set('section', 'items');
      url.searchParams.set('add', 'true');
      window.history.pushState({}, '', url);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden h-14">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left Section - Title & Subtitle */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">
            Elints <span className="text-slate-400 font-light hidden sm:inline">| Operations</span>
          </h1>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <p className="text-xs text-slate-500 hidden sm:block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            {user?.role ? user.role.toUpperCase() : 'USER'}
          </p>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <button
            onClick={handleCreateItem}
            className="hidden md:flex px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition duration-200 whitespace-nowrap shadow-sm border border-blue-600 items-center gap-1.5 uppercase tracking-wide"
          >
            <span>+ New Item</span>
          </button>

          <button
            onClick={onLogout}
            className="hidden md:flex px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-md hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition duration-200 items-center gap-2 whitespace-nowrap uppercase tracking-wide">
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          {/* Mobile Menu Button - Wires to Global Sidebar */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-slate-100 rounded-md transition"
          >
            {isMobileMenuOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
