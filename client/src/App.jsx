import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

// Layout imports
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';

// Page imports
import Dashboard from './pages/Dashboard';
import ItemPage from './pages/item';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('API URL:', apiUrl);
      const response = await axios.post(`${apiUrl}/api/login`, {
        email,
        password
      });

      if (response.data && response.data.success) {
        // Store user data and role
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setAuth(true);
        setUser(response.data.user);
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

  // Only development team can access dashboard
  if (!user || user.role !== 'development') {
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

  // Render the appropriate page based on activeSection
  const renderPage = () => {
    switch (activeSection) {
      case 'items':
        return <ItemPage />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        user={user}        onLogout={onLogout}      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:ml-48 lg:ml-56">
        <Header onLogout={onLogout} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} user={user} />
        {renderPage()}
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
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;