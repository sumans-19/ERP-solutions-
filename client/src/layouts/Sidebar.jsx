import React, { useState, useEffect } from 'react';
import {
  Home, Package, Activity, Archive, Users, BarChart3,
  LogOut, X, ChevronDown, Eye, Settings, ShoppingCart, Shield, ClipboardCheck, Calendar
} from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ activeSection, setActiveSection, isMobileOpen, setIsMobileOpen, user = {}, onLogout }) => {
  const [isViewsExpanded, setIsViewsExpanded] = useState(false);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false); // Added
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
      setLoading(true);
      // 1. Try to fetch INDIVIDUAL permissions first (Priority)
      let response;
      if (user.email === 'dev@elints.com' || user.role === 'development') {
        console.log('🛡️ Developer Access: Skipping individual profile check');
      } else {
        try {
          response = await axios.get(`${API_URL}/api/employees/email/${user.email}`);
          if (response.data && response.data.individualPermissions && response.data.individualPermissions.length > 0) {
            console.log('🛡️ Applying Individual Preferences for:', user.email);
            setRoleConfig({
              role: user.role,
              permissions: response.data.individualPermissions
            });
            return;
          }
        } catch (e) {
          console.warn('No individual employee profile found, falling back to role permissions');
        }
      }

      // 2. Fallback to ROLE-BASED permissions
      const roleResponse = await axios.get(`${API_URL}/api/role-permissions/${user.role}`);
      setRoleConfig(roleResponse.data);
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

  /* --- Navigation Configuration --- */ // ADDED comment for clarity
  const [expandedGroups, setExpandedGroups] = useState({
    tasks: false,
    settings: false,
    views: false
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const navStructure = [
    // 1. CoreRequested Items
    { id: 'dashboard', label: 'Admin Dashboard', icon: Home, type: 'item' },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart, type: 'item' },
    { id: 'process', label: 'Process Management', icon: Activity, type: 'item' },
    { id: 'items', label: 'Item Master', icon: Package, type: 'item' },
    {
      id: 'tasks', label: 'Tasks', icon: ClipboardCheck, type: 'group',
      children: [
        { id: 'tasks-todo', label: 'To-Do List', icon: ClipboardCheck },
        { id: 'tasks-followups', label: 'Follow-ups', icon: Activity }
      ]
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar, type: 'item' },
    { id: 'inventory', label: 'Inventory', icon: Archive, type: 'item' },
    { id: 'parties', label: 'Parties', icon: Users, type: 'item' },
    { id: 'reports', label: 'Reports', icon: BarChart3, type: 'item' },
    {
      id: 'settings', label: 'Settings', icon: Settings, type: 'group',
      children: [
        { id: 'company-info', label: 'Company Info', icon: Activity },
        { id: 'employee-master', label: 'Emp Master', icon: Users },
        { id: 'set-permissions', label: 'Preferences', icon: Shield },
        { id: 'set-time', label: 'Set Time', icon: Calendar },
        { id: 'system-settings', label: 'Advanced Settings', icon: Settings },
        { id: 'preferences', label: 'Preferences', icon: Home },
      ].filter(item => {
        if (item.id === 'preferences' && user?.role !== 'development') return false;
        return isVisible(item.id);
      })
    },

    // 2. Leftover Items (Bottom)
    { type: 'divider' }, // Visual separator
    { id: 'production', label: 'Production', icon: Activity, type: 'item' },
    { id: 'users', label: 'User Manage', icon: Users, type: 'item' },
    {
      id: 'views', label: 'Views', icon: Eye, type: 'group',
      children: [
        { id: 'admin-view', label: 'Admin View', icon: Shield },
        { id: 'employee-view', label: 'Employee View', icon: Users },
        { id: 'planning-view', label: 'Planning Team View', icon: BarChart3 },
      ]
    }
  ];

  /* --- Render Logic --- */
  const renderNavItem = (item) => {
    // Visibility Check
    if (item.type === 'divider') return <li key={Math.random()} className="my-2 border-t border-slate-800" />;
    if (!isVisible(item.id) && item.type !== 'group') return null; // Group visibility handled by children check below

    if (item.type === 'item') {
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all tracking-wide ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
          >
            <IconComponent size={18} className="flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300 hidden md:block"></div>}
          </button>
        </li>
      );
    }

    if (item.type === 'group') {
      const visibleChildren = item.children.filter(child => isVisible(child.id));
      if (visibleChildren.length === 0) return null;

      const isExpanded = expandedGroups[item.id];
      const IconComponent = item.icon;

      return (
        <li key={item.id} className="mt-1">
          <button
            onClick={() => toggleGroup(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <IconComponent size={18} className="flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            <ChevronDown
              size={14}
              className={`ml-auto flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <ul className="mt-1 ml-3 space-y-0.5 border-l border-slate-800 pl-3">
              {visibleChildren.map(child => {
                const ChildIcon = child.icon;
                const isChildActive = activeSection === child.id;
                return (
                  <li key={child.id}>
                    <button
                      onClick={() => {
                        setActiveSection(child.id);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${isChildActive ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      <ChildIcon size={14} className="flex-shrink-0" />
                      <span className="truncate text-xs">{child.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm border border-blue-500">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-slate-100 uppercase leading-none">Elints OMS</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Enterprise</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide">
        <div className="mb-2 px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden md:block">Main Menu</div>
        <ul className="space-y-1">
          {navStructure.map(item => renderNavItem(item))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-md bg-slate-800/50 border border-slate-800 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {(user?.role?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate capitalize">{user?.role || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50 border border-transparent rounded-md transition-all"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
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
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed left-0 top-14 w-full bg-slate-900 text-white z-40 flex flex-col md:hidden shadow-xl border-b border-slate-800 print:hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="p-3">
              <ul className="space-y-1">
                {navStructure.map(item => renderNavItem(item))}
              </ul>
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3 p-2 rounded-md bg-slate-800/50 border border-slate-800 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  {(user?.role?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate capitalize">{user?.role || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-900/50 border border-transparent rounded-md transition-all"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
