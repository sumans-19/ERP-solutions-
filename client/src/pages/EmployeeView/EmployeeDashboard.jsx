import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircle2, Clock, CheckSquare, MessageSquare,
    Briefcase, Bell, AlertTriangle, TrendingUp,
    Zap, Target, Package, Activity
} from 'lucide-react';
import { getEmployeeTasks, getAssignedJobs } from '../../services/api';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PieChart = ({ percentage, color = '#2563EB', size = 120 }) => {
    const strokeWidth = 8;
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
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-900">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, colorClass = "text-blue-600", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-slate-50 group-hover:bg-white transition-colors`}>
                <Icon className={`${colorClass} transition-colors`} size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {label}
            </span>
        </div>
        <p className="text-3xl font-bold text-slate-900">
            {value}
        </p>
    </motion.div>
);

const EmployeeDashboard = ({ user, setActiveSection }) => {
    const { selectedEmployeeId, selectedEmployee } = useEmployeeView();
    const [stats, setStats] = useState({
        completedTasks: 0,
        totalTasks: 0,
        activeJobs: 0,
        completedJobs: 0,
        unreadMessages: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [latestBulletins, setLatestBulletins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchStats();
            fetchLatestBulletins();
        }
    }, [selectedEmployeeId]);

    const fetchLatestBulletins = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/bulletins`);
            setLatestBulletins(response.data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching bulletins:', error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const tasks = await getEmployeeTasks(selectedEmployeeId);
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const jobsData = await getAssignedJobs(selectedEmployeeId);
            const jobs = jobsData.map(item => {
                const assignments = item.assignedEmployees.filter(a => a.employeeId === selectedEmployeeId);
                return assignments.map(a => {
                    const processStep = item.processes.find(p => String(p.id) === String(a.processStepId));
                    return {
                        ...a,
                        itemCode: item.code,
                        itemName: item.name,
                        itemId: item._id,
                        processName: processStep?.stepName || processStep?.name || 'Manufacturing Step'
                    };
                });
            }).flat();

            const activeJobs = jobs.filter(j => j.status === 'in-progress' || j.status === 'pending' || j.status === 'assigned').length;
            const completedJobs = jobs.filter(j => j.status === 'completed').length;

            const recentJobs = jobs
                .filter(j => j.status === 'in-progress' || j.status === 'completed')
                .sort((a, b) => new Date(b.completedAt || b.startedAt || 0) - new Date(a.completedAt || a.startedAt || 0))
                .slice(0, 4);

            setRecentActivity(recentJobs);
            setStats({
                completedTasks,
                totalTasks: tasks.length || 1,
                activeJobs,
                completedJobs,
                unreadMessages: 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const taskProgress = (stats.completedTasks / stats.totalTasks) * 100;
    const urgentBulletin = latestBulletins.find(b => b.priority === 'Urgent');

    if (!selectedEmployeeId) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Analytics...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">Efficiency Hub</h1>
                        <p className="text-slate-600 font-medium">
                            Performance overview for <span className="text-blue-600 font-bold">{selectedEmployee?.name}</span>
                        </p>
                    </div>
                </div>

                {/* Urgent Bulletin Alert */}
                {urgentBulletin && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Urgent Announcement</p>
                                <h3 className="text-sm font-bold text-slate-900">{urgentBulletin.title}</h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveSection('employee-bulletins')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition"
                        >
                            View Notice
                        </button>
                    </motion.div>
                )}

                {/* Stats Grid - Matching AdminDashboard Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Task Ratio" value={`${stats.completedTasks}/${stats.totalTasks}`} icon={Target} colorClass="text-emerald-600" delay={0.05} />
                    <StatCard label="Live Pipeline" value={stats.activeJobs} icon={Activity} colorClass="text-blue-600" delay={0.1} />
                    <StatCard label="Lifetime Gear" value={stats.completedJobs} icon={Package} colorClass="text-indigo-600" delay={0.15} />
                    <StatCard label="Comm Stream" value={stats.unreadMessages} icon={MessageSquare} colorClass="text-violet-600" delay={0.2} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Notice Board Widget */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Bell size={20} className="text-blue-600" /> Notice Board
                            </h3>
                        </div>
                        <div className="space-y-4 flex-1">
                            {latestBulletins.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm">No announcements to display.</div>
                            ) : (
                                latestBulletins.map((bulletin) => (
                                    <button
                                        key={bulletin._id}
                                        onClick={() => setActiveSection('employee-bulletins')}
                                        className="w-full text-left p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-100 rounded-lg transition-all"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${bulletin.priority === 'Urgent' ? 'text-red-500' : 'text-blue-600'}`}>
                                                {bulletin.priority}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{new Date(bulletin.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{bulletin.title}</h4>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setActiveSection('employee-bulletins')}
                            className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition transition-all active:scale-95"
                        >
                            View Archives
                        </button>
                    </div>

                    {/* Progress Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-bold text-slate-900 self-start mb-6 flex items-center gap-2">
                            <CheckSquare size={20} className="text-emerald-600" /> Performance
                        </h3>
                        <PieChart percentage={taskProgress} size={160} color="#059669" />
                        <div className="mt-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Efficiency Rating</p>
                            <p className="text-base font-bold text-slate-900">
                                {taskProgress > 80 ? 'Exceptional' : taskProgress > 50 ? 'Steady' : 'Emerging'}
                            </p>
                        </div>
                    </div>

                    {/* Recent Activity (Pulse) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-indigo-600" /> Recent Pulse
                        </h3>
                        <div className="space-y-6">
                            {recentActivity.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 text-sm">No recent activity.</div>
                            ) : (
                                recentActivity.map((job, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${job.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {job.status === 'completed' ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm text-slate-900 leading-tight mb-0.5 truncate">{job.itemName}</p>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    {job.processName}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {job.status === 'completed' ? 'Finalized' : 'Updated'} {new Date(job.completedAt || job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
