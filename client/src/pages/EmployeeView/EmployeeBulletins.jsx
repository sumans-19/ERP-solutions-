import React, { useState, useEffect } from 'react';
import { getBulletins } from '../../services/api';
import { Bell, AlertTriangle, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeBulletins = () => {
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBulletins();
    }, []);

    const fetchBulletins = async () => {
        try {
            setLoading(true);
            const data = await getBulletins();
            setBulletins(data || []);
        } catch (error) {
            console.error('Error fetching bulletins:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-20">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">Notice Board</h1>
                        <p className="text-slate-600 font-medium">Official administrative updates and global announcements.</p>
                    </div>
                </div>

                {/* Bulletins List */}
                <div className="space-y-6">
                    {bulletins.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-20 text-center">
                            <Bell size={48} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No New Notifications</h3>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-1">Updates from the administration will appear here.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {bulletins.map((bulletin, index) => (
                                <motion.div
                                    key={bulletin._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white rounded-xl border shadow-sm p-6 relative overflow-hidden group transition-all hover:shadow-md ${bulletin.priority === 'Urgent' ? 'border-red-200' : 'border-slate-200'
                                        }`}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${bulletin.priority === 'Urgent' ? 'bg-red-500' : 'bg-blue-600'
                                        }`}></div>

                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Priority Indicator Icon */}
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${bulletin.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {bulletin.priority === 'Urgent' ? <AlertTriangle size={24} /> : <Bell size={24} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${bulletin.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {bulletin.priority} Level
                                                </span>
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                                                    <Clock size={14} />
                                                    {new Date(bulletin.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                                                    <User size={14} />
                                                    {bulletin.createdBy?.email?.split('@')[0] || 'Admin'}
                                                </div>
                                            </div>

                                            <h2 className={`text-xl font-bold mb-3 tracking-tight ${bulletin.priority === 'Urgent' ? 'text-slate-900' : 'text-slate-900'
                                                }`}>
                                                {bulletin.title}
                                            </h2>

                                            <p className="text-slate-600 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                                                {bulletin.content}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeBulletins;
