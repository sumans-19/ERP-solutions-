import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, CheckSquare, MessageSquare, Briefcase } from 'lucide-react';
import { getEmployeeTasks } from '../../services/api';
import EmployeeSelector from '../../components/EmployeeSelector';

const PieChart = ({ percentage, color = '#2563EB', size = 120 }) => {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-slate-900">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
    </div>
);

const EmployeeDashboard = ({ user }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [stats, setStats] = useState({
        completedTasks: 0,
        totalTasks: 0,
        activeJobs: 0,
        unreadMessages: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchStats();
        }
    }, [selectedEmployeeId]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const tasks = await getEmployeeTasks(selectedEmployeeId);
            const completed = tasks.filter(t => t.status === 'Completed').length;

            setStats({
                completedTasks: completed,
                totalTasks: tasks.length || 1,
                activeJobs: 5,
                unreadMessages: 2
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const taskProgress = (stats.completedTasks / stats.totalTasks) * 100;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Employee Dashboard</h1>
                <p className="text-slate-500">View employee performance and activity</p>
            </div>

            <EmployeeSelector
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeChange={setSelectedEmployeeId}
            />

            {!selectedEmployeeId ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
                    <p className="text-slate-500">Select an employee to view their dashboard</p>
                </div>
            ) : loading ? (
                <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Task Completion"
                            value={`${stats.completedTasks}/${stats.totalTasks}`}
                            subtitle="Tasks completed"
                            icon={CheckSquare}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            title="Active Jobs"
                            value={stats.activeJobs}
                            subtitle="In progress"
                            icon={Briefcase}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Unread Messages"
                            value={stats.unreadMessages}
                            subtitle="Check your chat"
                            icon={MessageSquare}
                            color="bg-violet-500"
                        />
                        <StatCard
                            title="Hours Logged"
                            value="32.5"
                            subtitle="This week"
                            icon={Clock}
                            color="bg-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Progress Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Progress</h3>
                            <div className="flex flex-col items-center justify-center py-4">
                                <PieChart percentage={taskProgress} size={180} color="#2563EB" />
                                <p className="mt-4 text-sm text-slate-500 text-center">
                                    Completed <span className="font-bold text-slate-900">{Math.round(taskProgress)}%</span> of assigned tasks this week
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Overview</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Manufacturing: Control Panel</p>
                                        <p className="text-xs text-slate-500">Step 3: Wiring in progress</p>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">In Progress</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Maintenance Check</p>
                                        <p className="text-xs text-slate-500">Completed at 10:30 AM</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Done</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeDashboard;
