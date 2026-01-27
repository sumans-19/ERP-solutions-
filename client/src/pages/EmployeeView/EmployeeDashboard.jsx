import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, CheckSquare, MessageSquare, Briefcase } from 'lucide-react';
import { getEmployeeTasks, getAssignedJobs, getChatMessages } from '../../services/api';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

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
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
            <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
    </div>
);

const EmployeeDashboard = ({ user }) => {
    const { selectedEmployeeId, selectedEmployee } = useEmployeeView();
    const [stats, setStats] = useState({
        completedTasks: 0,
        totalTasks: 0,
        activeJobs: 0,
        completedJobs: 0,
        unreadMessages: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchStats();
        }
    }, [selectedEmployeeId]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch tasks
            const tasks = await getEmployeeTasks(selectedEmployeeId);
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;

            // Fetch jobs
            const jobsData = await getAssignedJobs(selectedEmployeeId);
            const jobs = jobsData.map(item => {
                const assignments = item.assignedEmployees.filter(a => a.employeeId === selectedEmployeeId);
                return assignments.map(a => ({
                    ...a,
                    itemCode: item.code,
                    itemName: item.name,
                    itemId: item._id,
                    processDetails: item.processes.find(p => p.id === a.processStepId)
                }));
            }).flat();

            const activeJobs = jobs.filter(j => j.status === 'in-progress' || j.status === 'pending' || j.status === 'assigned').length;
            const completedJobs = jobs.filter(j => j.status === 'completed').length;

            // Get recent activity from jobs
            const recentJobs = jobs
                .filter(j => j.status === 'in-progress' || j.status === 'completed')
                .sort((a, b) => {
                    const dateA = a.completedAt || a.startedAt || new Date(0);
                    const dateB = b.completedAt || b.startedAt || new Date(0);
                    return new Date(dateB) - new Date(dateA);
                })
                .slice(0, 2);

            setRecentActivity(recentJobs);

            setStats({
                completedTasks,
                totalTasks: tasks.length || 1,
                activeJobs,
                completedJobs,
                unreadMessages: 0 // Will be calculated from chat if needed
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const taskProgress = (stats.completedTasks / stats.totalTasks) * 100;

    if (!selectedEmployeeId) {
        return null; // Layout handles empty state
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-4 sm:space-y-6 h-full overflow-auto">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Employee Dashboard</h1>
                <p className="text-sm sm:text-base text-slate-500">
                    Viewing performance for {selectedEmployee?.name || 'employee'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    title="Completed Jobs"
                    value={stats.completedJobs}
                    subtitle="Total completed"
                    icon={CheckCircle}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Unread Messages"
                    value={stats.unreadMessages}
                    subtitle="Check your chat"
                    icon={MessageSquare}
                    color="bg-violet-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Progress Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6">Task Progress</h3>
                    <div className="flex flex-col items-center justify-center py-4">
                        <PieChart percentage={taskProgress} size={180} color="#2563EB" />
                        <p className="mt-4 text-xs sm:text-sm text-slate-500 text-center">
                            Completed <span className="font-bold text-slate-900">{Math.round(taskProgress)}%</span> of assigned tasks
                        </p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3 sm:space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No recent activity
                            </div>
                        ) : (
                            recentActivity.map((job, idx) => (
                                <div key={idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${job.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {job.status === 'completed' ? <CheckCircle size={18} /> : <Briefcase size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm sm:text-base text-slate-900 truncate">
                                            {job.processName}: {job.itemName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {job.status === 'completed'
                                                ? `Completed ${job.completedAt ? new Date(job.completedAt).toLocaleString() : 'recently'}`
                                                : `Started ${job.startedAt ? new Date(job.startedAt).toLocaleString() : 'recently'}`
                                            }
                                        </p>
                                    </div>
                                    <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${job.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {job.status === 'completed' ? 'Done' : 'In Progress'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
