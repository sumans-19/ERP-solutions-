import React, { useState } from 'react';
import { Home, ClipboardCheck, Briefcase, MessageSquare, Bell, ChevronDown, User, Globe, Calendar } from 'lucide-react';
import { useEmployeeView } from '../contexts/EmployeeViewContext';

const EmployeeViewLayout = ({ activeTab, setActiveTab, children }) => {
    const { selectedEmployeeId, setSelectedEmployeeId, selectedEmployee, employees, loading } = useEmployeeView();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const tabs = [
        { id: 'employee-dashboard', label: 'Dashboard', icon: Home },
        { id: 'employee-jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'employee-calendar', label: 'Calendar', icon: Calendar },
        { id: 'employee-global-jobs', label: 'Jobs', icon: Globe },
        { id: 'employee-tasks', label: 'Tasks', icon: ClipboardCheck },
        { id: 'employee-chat', label: 'Chat', icon: MessageSquare },
        { id: 'employee-bulletins', label: 'Bulletins', icon: Bell }
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Employee Selector */}
                        <div className="relative w-full sm:w-auto">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full sm:w-80 flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg hover:border-blue-400 hover:bg-white transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                        {selectedEmployee?.name?.[0]?.toUpperCase() || <User size={18} />}
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 text-sm truncate">
                                            {selectedEmployee?.name || 'Select Employee'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {selectedEmployee?.role || 'No employee selected'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="absolute left-0 right-0 sm:right-auto sm:w-80 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-[400px] overflow-y-auto">
                                        <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                                            Select Employee
                                        </div>
                                        {loading ? (
                                            <div className="px-4 py-3 text-sm text-slate-400">Loading employees...</div>
                                        ) : employees.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-slate-400 italic">No employees found</div>
                                        ) : (
                                            employees.map(emp => (
                                                <button
                                                    key={emp._id}
                                                    onClick={() => {
                                                        setSelectedEmployeeId(emp._id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedEmployeeId === emp._id ? 'bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${selectedEmployeeId === emp._id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {emp.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`font-medium text-sm truncate ${selectedEmployeeId === emp._id ? 'text-blue-700' : 'text-slate-900'
                                                            }`}>
                                                            {emp.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{emp.role}</p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${isActive
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50">
                {!selectedEmployeeId ? (
                    <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={40} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Employee Selected</h3>
                            <p className="text-slate-500">
                                Please select an employee from the dropdown above to view their information.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 sm:p-6 h-full">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeViewLayout;
