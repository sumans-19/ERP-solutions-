import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, Briefcase, MessageSquare, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { getContacts } from '../services/api';

const EmployeeLayout = ({ activeSection, setActiveSection, onLogout, user, children }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?.id);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Check if user is admin (can simulate employee view)
    const isAdmin = user && ['admin', 'development', 'dev'].includes(user.role);

    useEffect(() => {
        if (isAdmin) {
            fetchEmployees();
        }
    }, [isAdmin]);

    const fetchEmployees = async () => {
        try {
            const data = await getContacts();
            const emps = data.filter(c => c.type === 'Employee');
            setEmployees(emps);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleEmployeeChange = (empId) => {
        setSelectedEmployeeId(empId);
        setIsDropdownOpen(false);
    };

    // Determine which user to display (simulated or actual)
    const displayedUser = isAdmin && selectedEmployeeId !== user.id
        ? { ...employees.find(e => e._id === selectedEmployeeId), role: 'employee' }
        : user;

    // Clone children and pass displayedUser as prop
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { user: displayedUser });
        }
        return child;
    });

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'bulletins', label: 'Bulletins', icon: Bell }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    E
                                </div>
                                <span className="text-xl font-bold text-slate-900 hidden md:block">Elints OMS</span>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex space-x-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side: Employee Selector & User Profile */}
                        <div className="flex items-center gap-4">
                            {/* Admin Employee Selector */}
                            {isAdmin && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold transition-colors hover:bg-amber-100"
                                    >
                                        <User size={16} />
                                        <span className="max-w-[100px] truncate">{displayedUser?.name || 'Select Employee'}</span>
                                        <ChevronDown size={14} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsDropdownOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 max-h-[400px] overflow-y-auto">
                                                <div className="px-4 py-2 border-b border-slate-50 text-xs font-bold text-slate-400 uppercase">
                                                    Viewing as:
                                                </div>
                                                {employees.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-slate-400 italic">No employees found</div>
                                                ) : (
                                                    employees.map(emp => (
                                                        <button
                                                            key={emp._id}
                                                            onClick={() => handleEmployeeChange(emp._id)}
                                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedEmployeeId === emp._id ? 'bg-blue-50' : ''
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedEmployeeId === emp._id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {emp.name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className={`font-medium ${selectedEmployeeId === emp._id ? 'text-blue-700' : 'text-slate-900'}`}>{emp.name}</p>
                                                                <p className="text-xs text-slate-500">{emp.role}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* User Profile */}
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                                    {displayedUser?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-medium text-slate-700">{displayedUser?.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{displayedUser?.role}</p>
                                </div>
                            </div>

                            <button
                                onClick={onLogout}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile Nav */}
                <div className="md:hidden overflow-x-auto pb-4 mb-4 flex gap-2 no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-slate-200 text-slate-600'
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {childrenWithProps}
            </main>
        </div>
    );
};

export default EmployeeLayout;
