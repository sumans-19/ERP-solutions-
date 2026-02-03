import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function PopupNotification({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (message && duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200 min-w-[320px] max-w-sm mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-bounce-short ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isSuccess ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
                    {isSuccess ? 'Success!' : 'Error'}
                </h3>

                <p className="text-slate-500 text-center font-medium">
                    {message}
                </p>
            </div>
        </div>
    );
}
