import React, { useState, useEffect } from 'react';
import { getBulletins } from '../../services/api';
import { Bell, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

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
            setBulletins(data);
        } catch (error) {
            console.error('Error fetching bulletins:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading bulletins...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Company Bulletins</h1>
                <p className="text-slate-500">Important announcements and updates</p>
            </div>

            <div className="space-y-4">
                {bulletins.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <Bell size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No bulletins posted yet.</p>
                    </div>
                ) : (
                    bulletins.map(bulletin => (
                        <motion.div
                            key={bulletin._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden ${bulletin.priority === 'Urgent'
                                    ? 'border-red-200 bg-red-50/30'
                                    : 'border-slate-200'
                                }`}
                        >
                            {bulletin.priority === 'Urgent' && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                    <AlertTriangle size={12} /> Urgent
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${bulletin.priority === 'Urgent'
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {bulletin.priority === 'Urgent' ? <AlertTriangle size={24} /> : <Bell size={24} />}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">{bulletin.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{bulletin.content}</p>

                                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                                        <span>Posted on {new Date(bulletin.date).toLocaleDateString()}</span>
                                        <span>By {bulletin.createdBy?.email || 'Admin'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmployeeBulletins;
