import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const icons = {
    success: <CheckCircle className="w-8 h-8 text-emerald-500" />,
    error: <X className="w-8 h-8 text-rose-500" />,
    info: <Info className="w-8 h-8 text-blue-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-amber-500" />
};

const colors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-blue-50 border-blue-100',
    warning: 'bg-amber-50 border-amber-100'
};

const ringColors = {
    success: 'ring-emerald-500/20',
    error: 'ring-rose-500/20',
    info: 'ring-blue-500/20',
    warning: 'ring-amber-500/20'
};

export default function PopupNotification({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (message && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                {/* Backdrop Blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                    onClick={onClose}
                />

                {/* Notification Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative w-[90%] max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden pointer-events-auto p-8 flex flex-col items-center ring-8 ${ringColors[type]}`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon with Ring */}
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${colors[type]}`}
                    >
                        {icons[type]}
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                    >
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">
                            {type === 'success' ? 'Task Completed' : type.toUpperCase()}
                        </h3>
                        <p className="text-slate-500 font-bold leading-relaxed">
                            {message}
                        </p>
                    </motion.div>

                    {/* Progress Bar (Auto-hide indicator) */}
                    {duration > 0 && (
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: duration / 1000, ease: "linear" }}
                            className={`absolute bottom-0 left-0 h-1.5 ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : type === 'info' ? 'bg-blue-500' : 'bg-amber-500'}`}
                        />
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
