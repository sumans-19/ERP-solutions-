import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Package, Activity, ShoppingCart, LayoutDashboard, UserCog, Archive, MessageSquare, ClipboardCheck, Users } from 'lucide-react';

// Layout imports
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';

// Page imports
import Dashboard from './pages/Dashboard';
import ItemPage from './pages/item';
import Orders from './pages/Orders';
import ProcessManagement from './pages/ProcessManagement';
import UserManagement from './pages/UserManagement/Employees';
import PlanningDashboard from './pages/PlanningDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CommunicationHub from './pages/CommunicationHub';
import EmployeeTasks from './pages/EmployeeTasks';
import InventoryDashboard from './pages/InventoryDashboard';
import PartiesPage from './pages/UserManagement/PartiesPage';
import Inventory from './pages/Inventory';
import ProfileSettings from './pages/Settings/ProfileSettings';
import SystemSettings from './pages/Settings/SystemSettings';
import CompanyInfo from './pages/Settings/CompanyInfo';
import IndividualPermissions from './pages/Settings/IndividualPermissions';
import ShiftTimeSettings from './pages/Settings/ShiftTimeSettings';
import ReportManage from './pages/ReportManage';
import ProductionModule from './pages/Production/ProductionModule';


// Employee View Imports
import EmployeeDashboard from './pages/EmployeeView/EmployeeDashboard';
import EmployeeTasksView from './pages/EmployeeView/EmployeeTasks';
import EmployeeJobs from './pages/EmployeeView/EmployeeJobs';
import EmployeeChat from './pages/EmployeeView/EmployeeChat';
import EmployeeBulletins from './pages/EmployeeView/EmployeeBulletins';

// Task View Imports
import TodoListPage from './pages/Tasks/TodoListPage';
import FollowUpsPage from './pages/Tasks/FollowUpsPage';

// Admin View Imports
import TaskAssignment from './pages/AdminView/TaskAssignment';
import CommunicationManagement from './pages/AdminView/CommunicationManagement';
import EmployeeWorkloadManagement from './pages/AdminView/EmployeeWorkloadManagement';
import Preferences from './pages/AdminView/Preferences';

// Employee View Context and Layout
import { EmployeeViewProvider } from './contexts/EmployeeViewContext';
import EmployeeViewLayout from './layouts/EmployeeViewLayout';

// Additional Imports from instruction
import CalendarPage from './pages/Calendar/CalendarPage';

/**
 * Login Component
 * Handles user authentication
 * Backend endpoint: POST /api/auth/login
 */
const Login = ({ setAuth, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      console.log('API URL:', apiUrl);
      const response = await axios.post(`${apiUrl}/api/login`, {
        email,
        password
      });

      if (response.data && response.data.success) {
        // Store user data and role
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));

        // Set global headers for all subsequent requests
        axios.defaults.headers.common['x-user-role'] = userData.role;
        axios.defaults.headers.common['x-user-id'] = userData._id;

        // Fetch dynamic permissions
        try {
          const permsRes = await axios.get(`${apiUrl}/api/role-permissions/${userData.role}`);
          localStorage.setItem('role_permissions', JSON.stringify(permsRes.data));
        } catch (e) {
          console.warn("Could not fetch remote permissions, using defaults.");
        }

        setAuth(true);
        setUser(userData);
        navigate('/dashboard');
      } else {
        setError(response.data?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Restore axios headers on app load if user is logged in
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role) {
        axios.defaults.headers.common['x-user-role'] = u.role;
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-2xl border border-slate-200"
      >
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            E
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">Welcome Back</h2>
        <p className="text-slate-500 text-center mb-8 text-sm sm:text-base">Login to your Elints ERP Dashboard</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition duration-200 text-sm sm:text-base"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-6">
          Dev account: dev@elints.com / dev@123
        </p>
      </motion.div>
    </div>
  );
};

/**
 * Main Dashboard Layout
 * Combines sidebar, header, and page content
 */
const DashboardLayout = ({ onLogout, user }) => {
  const navigate = useNavigate();

  // Allow development, planning, and admin roles to access dashboard
  if (!user || !['development', 'planning', 'admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md"
        >
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You do not have permission to access this dashboard. Only development team members can access this system.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              onLogout();
              navigate('/login');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Sync active section with query params or role default
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    } else if (user?.role === 'planning') {
      setActiveSection('planning-view');
    }
  }, [location.search, user?.role]);

  // Render the appropriate page based on activeSection
  const renderPage = () => {
    switch (activeSection) {
      case 'items':
        return <ItemPage />;
      case 'orders':
        return <Orders />;
      case 'process':
        return <ProcessManagement />;
      case 'production':
        return <ProductionModule />;
      case 'users':

        return <UserManagement />;
      case 'parties':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <PartiesPage /> : <Dashboard />;
      case 'tasks-todo': // New Route
        return <TodoListPage />;
      case 'tasks-followups': // New Route
        return <FollowUpsPage />;
      case 'inventory-dash':
        return user?.role === 'admin' ? <InventoryDashboard setActiveSection={setActiveSection} /> : <Dashboard />;
      case 'comm-hub':
      case 'chats':
      case 'bulletin':
      case 'admin-comm-hub':
      case 'admin-chats':
      case 'admin-bulletin':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <CommunicationHub activeSection={activeSection} setActiveSection={setActiveSection} user={user} /> : <Dashboard />;
      case 'tasks-list':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <EmployeeTasks /> : <Dashboard />;
      case 'planning-view':
        return <PlanningDashboard setActiveSection={setActiveSection} />;
      case 'inventory':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <Inventory /> : <Dashboard />;
      case 'admin-view':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <AdminDashboard setActiveSection={setActiveSection} /> : <Dashboard />;
      case 'admin-process':
        return <ProcessManagement />;
      case 'admin-items':
        return <ItemPage />;
      case 'admin-users':
        return <UserManagement />;
      case 'admin-communication':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <CommunicationManagement user={user} /> : <Dashboard />;
      case 'admin-inventory':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <Inventory /> : <Dashboard />;

      case 'admin-tasks-list':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <TaskAssignment user={user} /> : <Dashboard />;
      case 'admin-jobs-list':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <EmployeeWorkloadManagement user={user} /> : <Dashboard />;
      case 'employee-view':
      case 'employee-dashboard':
      case 'employee-tasks':
      case 'employee-jobs':
      case 'employee-chat':
      case 'employee-bulletins':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? (
          <EmployeeViewProvider>
            <EmployeeViewLayout activeTab={activeSection === 'employee-view' ? 'employee-dashboard' : activeSection} setActiveTab={setActiveSection}>
              {(() => {
                const tab = activeSection === 'employee-view' ? 'employee-dashboard' : activeSection;
                switch (tab) {
                  case 'employee-dashboard':
                    return <EmployeeDashboard user={user} setActiveSection={setActiveSection} />;
                  case 'employee-tasks':
                    return <EmployeeTasksView user={user} />;
                  case 'employee-jobs':
                    return <EmployeeJobs user={user} />;
                  case 'employee-chat':
                    return <EmployeeChat user={user} />;
                  case 'employee-bulletins':
                    return <EmployeeBulletins />;
                  default:
                    return <EmployeeDashboard user={user} />;
                }
              })()}
            </EmployeeViewLayout>
          </EmployeeViewProvider>
        ) : <Dashboard />;
      case 'admin-orders':
        return <Orders />;
      case 'admin-production':
        return <ProductionModule />;
      case 'admin-parties':

        return <PartiesPage />;
      case 'admin-inventory-dash':
        return <InventoryDashboard setActiveSection={setActiveSection} />;
      case 'preferences':
        return (user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') ? <Preferences user={user} /> : <Dashboard />;
      case 'profile-settings':
        return <ProfileSettings />;
      case 'company-info':
        return <CompanyInfo />;
      case 'employee-master':
        return <UserManagement initialTab="employees" />;
      case 'set-permissions':
        return <IndividualPermissions />;
      case 'set-time':
        return <ShiftTimeSettings />;
      case 'system-settings':
        return <SystemSettings />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <ReportManage />;
      case 'dashboard':
      default:
        if (user?.role === 'planning') return <PlanningDashboard setActiveSection={setActiveSection} />;
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="print:hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          user={user} onLogout={onLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:ml-60 lg:ml-72">
        <Header onLogout={onLogout} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} user={user} setActiveSection={setActiveSection} />

        {/* Planning Team Sub-Navigation */}
        {user?.role === 'planning' && activeSection !== 'planning-view' && (
          <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {[
                { id: 'items', label: 'Item Manage', icon: Package },
                { id: 'process', label: 'Process Manage', icon: Activity },
                { id: 'production', label: 'Production', icon: Activity },
                { id: 'orders', label: 'Order Manage', icon: ShoppingCart }

              ].map(nav => (
                <button
                  key={nav.id}
                  onClick={() => setActiveSection(nav.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeSection === nav.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <nav.icon size={16} />
                  {nav.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveSection('planning-view')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Admin Team Top Navigation - Only show in admin view */}
        {(user?.role === 'admin' || user?.role === 'dev' || user?.role === 'development') &&
          activeSection.startsWith('admin-') && (
            <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'admin-view', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'admin-process', label: 'Process Mgmt', icon: Activity },
                  { id: 'admin-items', label: 'Items Mgmt', icon: Package },
                  { id: 'admin-orders', label: 'Orders Mgmt', icon: ShoppingCart },
                  { id: 'admin-production', label: 'Production Mgmt', icon: Activity },
                  { id: 'admin-users', label: 'User Mgmt', icon: UserCog },

                  { id: 'admin-inventory', label: 'Inventory Mgmt', icon: Archive },
                  { id: 'admin-comm-hub', label: 'Communication Mgmt', icon: MessageSquare },
                  { id: 'admin-tasks-list', label: 'Emp Tasks', icon: ClipboardCheck },
                  { id: 'admin-jobs-list', label: 'Emp Jobs', icon: Users }
                ].map(nav => (
                  <button
                    key={nav.id}
                    onClick={() => setActiveSection(nav.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeSection === nav.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                  >
                    <nav.icon size={16} />
                    {nav.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Router
 * Handles routing between Login and Dashboard
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const user = localStorage.getItem('user');
    return !!user;
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      axios.defaults.headers.common['x-user-role'] = user.role;
      axios.defaults.headers.common['x-user-id'] = user._id;

      // Sync permissions on reload
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      axios.get(`${apiUrl}/api/role-permissions/${user.role}`)
        .then(res => localStorage.setItem('role_permissions', JSON.stringify(res.data)))
        .catch(err => console.warn("Permission sync failed"));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} setUser={setUser} />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardLayout onLogout={handleLogout} user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Support /items routes and redirect to dashboard with query params */}
        <Route
          path="/items"
          element={
            isAuthenticated ? (
              <Navigate to={`/dashboard?section=items${window.location.search}`} replace />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks"
          element={
            isAuthenticated ? (
              <Navigate to={`/dashboard?section=tasks-todo`} replace />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/tasks/followups" element={<FollowUpsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;