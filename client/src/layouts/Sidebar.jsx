import React, { useState } from 'react';
import { Home, Package, Activity, Archive, Users, BarChart3, LogOut, X, ChevronDown, Eye, Settings, ShoppingCart } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, isMobileOpen, setIsMobileOpen, user = {}, onLogout }) => {
  const [isViewsExpanded, setIsViewsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const allNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'items', label: 'Item Manage', icon: Package },
    { id: 'orders', label: 'Order Manage', icon: ShoppingCart },
    { id: 'process', label: 'Process Manag', icon: Activity },
    { id: 'inventory', label: 'Inventory Manage', icon: Archive },
    { id: 'users', label: 'User Manage', icon: Users },
    { id: 'reports', label: 'Report Manage', icon: BarChart3 },
  ];

  // Filter items based on user role
  const navigationItems = allNavigationItems.filter(item => {
    if (user?.role === 'planning') {
      return ['dashboard', 'items', 'orders', 'process'].includes(item.id);
    }
    return true; // Default show all for development/admin
  });

  const viewItems = [
    { id: 'admin-view', label: 'Admin View', icon: Users },
    { id: 'employee-view', label: 'Employee View', icon: Home },
    { id: 'planning-view', label: 'Planning Team View', icon: BarChart3 },
  ];

  const settingsItems = [
    { id: 'profile-settings', label: 'Profile Settings', icon: Users },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
    { id: 'preferences', label: 'Preferences', icon: Home },
    { id: 'security', label: 'Security', icon: Archive },
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-3 sm:p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
            E
          </div>
          <span className="font-bold text-xs sm:text-sm hidden md:inline truncate tracking-wide uppercase">Elints OMS</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 sm:p-3 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto scrollbar-hide">
        <ul className="space-y-0.5 sm:space-y-1 md:space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    const targetId = item.id === 'dashboard' && user?.role === 'planning' ? 'planning-view' : item.id;
                    setActiveSection(targetId);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition tracking-wide ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <IconComponent size={16} className="flex-shrink-0" />
                  <span className="hidden md:inline truncate">{item.label}</span>
                  {(isActive || (item.id === 'dashboard' && activeSection === 'planning-view')) && <span className="ml-auto text-blue-300 hidden md:inline text-xs">→</span>}
                </button>
              </li>
            );
          })}

          {user?.role !== 'planning' && (
            <li className="mt-4 md:mt-6">
              <button
                onClick={() => setIsViewsExpanded(!isViewsExpanded)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <Eye size={16} className="flex-shrink-0" />
                <span className="hidden md:inline truncate">Views</span>
                <ChevronDown
                  size={14}
                  className={`ml-auto hidden md:block flex-shrink-0 transition-transform ${isViewsExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Views Submenu */}
              {isViewsExpanded && (
                <ul className="mt-1 ml-2 space-y-0.5 border-l border-slate-700 pl-2">
                  {viewItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs transition ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                          <IconComponent size={14} className="flex-shrink-0" />
                          <span className="hidden md:inline truncate text-xs">{item.label}</span>
                          {isActive && <span className="ml-auto text-blue-300 hidden md:inline text-xs">→</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}

          {/* Settings Section */}
          <li className="mt-4 md:mt-6">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Settings size={16} className="flex-shrink-0" />
              <span className="hidden md:inline truncate">Settings</span>
              <ChevronDown
                size={14}
                className={`ml-auto hidden md:block flex-shrink-0 transition-transform ${isSettingsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Settings Submenu */}
            {isSettingsExpanded && (
              <ul className="mt-1 ml-2 space-y-0.5 border-l border-slate-700 pl-2">
                {settingsItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveSection(item.id);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs transition ${isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        <IconComponent size={14} className="flex-shrink-0" />
                        <span className="hidden md:inline truncate text-xs">{item.label}</span>
                        {isActive && <span className="ml-auto text-blue-300 hidden md:inline text-xs">→</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-2.5 sm:p-3 md:p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 mb-2">
          <div className="w-7 h-7 bg-blue-500 rounded text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {(user?.role?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-xs font-medium truncate">{user?.role || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'user@email.com'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center md:justify-start gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
          <LogOut size={14} className="flex-shrink-0" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-60 lg:w-72 bg-slate-900 text-white h-screen fixed left-0 top-0 flex-col shadow-xl border-r border-slate-800">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 w-60 h-screen bg-slate-900 text-white z-40 flex flex-col md:hidden shadow-xl border-r border-slate-800">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
