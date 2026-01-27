import React, { useState, useEffect } from 'react';
import { Bell, Send, AlertTriangle, Clock, History, User, Zap } from 'lucide-react';
import { getBulletins, createBulletin } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBulletins = () => {
    const [title, setTitle] = useState('');
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBulletins();
    }, []);

    const fetchBulletins = async () => {
        try {
            setLoading(true);
            const data = await getBulletins();
            setBulletins(data || []);
        } catch (error) {
            console.error('Failed to fetch bulletins:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendBulletin = async (e) => {
        e.preventDefault();
        if (!bulletinMessage.trim() || !title.trim()) return;

        try {
            setIsSubmitting(true);
            const response = await createBulletin({
                title: title.trim(),
                content: bulletinMessage.trim(),
                priority: priority
            });
            console.log('Bulletin created:', response);
            setBulletinMessage('');
            setTitle('');
            setPriority('Normal');
            fetchBulletins();
            alert('Broadcasting Successful: Your announcement has been sent to all staff.');
        } catch (error) {
            console.error('Failed to send bulletin:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown network error';
            alert(`Broadcasting Failed: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && bulletins.length === 0) {
        return <div className="p-8 text-center text-slate-500 font-medium">Loading archives...</div>;
    }

    return (
        <div className="flex flex-col h-full space-y-6 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* Creation Form - Consistent with Card styling */}
                <div className="lg:col-span-1 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Send size={20} className="text-blue-600" /> Create Broadcast
                        </h2>

                        <form onSubmit={sendBulletin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Announcement Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief descriptive title..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Priority Level</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Normal', 'Urgent'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${priority === p
                                                    ? p === 'Urgent'
                                                        ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                                        : 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            {p === 'Urgent' ? <AlertTriangle size={12} /> : <Zap size={12} />}
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Announcement Body</label>
                                <textarea
                                    value={bulletinMessage}
                                    onChange={(e) => setBulletinMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    rows="5"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!bulletinMessage.trim() || !title.trim() || isSubmitting}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send Broadcast
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-2">
                            <Zap size={14} /> Usage Note
                        </h4>
                        <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
                            Broadcasting will send an immediate notification to all active employees. Urgent messages will be highlighted at the top of their dashboard.
                        </p>
                    </div>
                </div>

                {/* Logs Area - Professional Table-like feel */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <History size={18} className="text-slate-400" /> Broadcast Logs
                        </h2>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            {bulletins.length} Total Logs
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
                        {bulletins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                                <History size={48} className="opacity-10" />
                                <p className="text-sm font-medium">No history found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bulletins.map((bulletin) => (
                                    <div
                                        key={bulletin._id}
                                        className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden group"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${bulletin.priority === 'Urgent' ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="min-w-0 pr-4">
                                                <h4 className="font-bold text-slate-900 text-sm mb-1 truncate">{bulletin.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${bulletin.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {bulletin.priority}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                                                        <Clock size={12} />
                                                        {new Date(bulletin.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                                <User size={12} />
                                                {bulletin.createdBy?.email?.split('@')[0] || 'Admin'}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-2">
                                            {bulletin.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBulletins;
