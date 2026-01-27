import React, { useState, useEffect } from 'react';
import {
  Home, Package, Activity, Archive, Users, BarChart3,
  LogOut, X, ChevronDown, Eye, Settings, ShoppingCart, Shield
} from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ activeSection, setActiveSection, isMobileOpen, setIsMobileOpen, user = {}, onLogout }) => {
  const [isViewsExpanded, setIsViewsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [roleConfig, setRoleConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (user?.role) {
      fetchPermissions();
    }
  }, [user?.role]);

  const fetchPermissions = async () => {
    try {
      // Development role bypasses filtering, but we fetch anyway for data structure
      const response = await axios.get(`${API_URL}/api/role-permissions/${user.role}`);
      setRoleConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch sidebar permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVisible = (sectionId) => {
    if (user?.role === 'development') return true;
    if (!roleConfig) return true; // Default to visible if fetch fails or hasn't finished
    const config = roleConfig.permissions.find(p => p.section === sectionId);
    return config ? config.visibility : true;
  };

  const allNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'items', label: 'Item Manage', icon: Package },
    { id: 'orders', label: 'Order Manage', icon: ShoppingCart },
    { id: 'process', label: 'Process Manag', icon: Activity },
    { id: 'inventory', label: 'Inventory Manage', icon: Archive },
    { id: 'users', label: 'User Manage', icon: Users },
    { id: 'reports', label: 'Report Manage', icon: BarChart3 },
  ];

  // Dynamically filter items based on DB permissions
  const navigationItems = allNavigationItems.filter(item => isVisible(item.id));

  const viewItems = [
    { id: 'admin-view', label: 'Admin View', icon: Shield },
    { id: 'employee-view', label: 'Employee View', icon: Users },
    { id: 'planning-view', label: 'Planning Team View', icon: BarChart3 },
  ].filter(item => isVisible(item.id));

  const settingsItems = [
    { id: 'profile-settings', label: 'Profile Settings', icon: Users },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
    { id: 'preferences', label: 'Preferences', icon: Home }, // This will be handled by role check below
  ].filter(item => {
    if (item.id === 'preferences' && user?.role !== 'development') return false;
    return isVisible(item.id);
  });

  const sidebarContent = (
    <>
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

          {viewItems.length > 0 && (
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

              {isViewsExpanded && (
                <ul className="mt-1 ml-2 space-y-0.5 border-l border-slate-700 pl-2">
                  {viewItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = item.id === 'admin-view'
                      ? activeSection.startsWith('admin-')
                      : item.id === 'employee-view'
                        ? activeSection.startsWith('employee-')
                        : activeSection === item.id;
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

          {settingsItems.length > 0 && (
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
          )}
        </ul>
      </nav>

      <div className="p-2.5 sm:p-3 md:p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 mb-2">
          <div className="w-7 h-7 bg-blue-500 rounded text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {(user?.role?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-xs font-medium truncate">{user?.role || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <LogOut size={14} />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="hidden md:flex w-60 lg:w-72 bg-slate-900 text-white h-screen fixed left-0 top-0 flex-col shadow-xl border-r border-slate-800 print:hidden">
        {sidebarContent}
      </div>
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 w-60 h-screen bg-slate-900 text-white z-40 flex flex-col md:hidden shadow-xl border-r border-slate-800 print:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
