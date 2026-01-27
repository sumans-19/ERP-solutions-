import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Lock, Save, Shield, Camera, Key, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProfileSettings = () => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData(prev => ({
                ...prev,
                companyName: parsedUser.name || '',
                email: parsedUser.email || ''
            }));
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.put(`${API_URL}/api/users/${user.id}`, {
                companyName: formData.companyName,
                email: formData.email,
                password: formData.newPassword || undefined
            });

            if (response.data) {
                const updatedUser = { ...user, name: formData.companyName, email: formData.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            }
        } catch (error) {
            console.error('Update profile error:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 mt-2">Manage your personal profile and security preferences</p>
            </motion.div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-6 p-4 rounded-lg flex items-center gap-3 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <Shield size={20} />}
                    <span className="font-medium">{message.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-8">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-slate-600">
                                            {user.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full text-white shadow-md border-2 border-white group-hover:bg-blue-600 transition">
                                        <Camera size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-16 pb-8 px-6 text-center">
                            <h3 className="text-xl font-bold text-slate-900">{user.name || 'User'}</h3>
                            <p className="text-slate-500 text-sm mt-1 mb-4">{user.email}</p>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                <Shield size={12} />
                                {user.role?.toUpperCase()}
                            </div>
                        </div>
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                            <p className="text-xs text-center text-slate-400">
                                Member since {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Settings Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <User className="text-blue-600" size={20} />
                                    Personal Information
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Building size={16} className="text-slate-400" /> Company / Name
                                        </label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Mail size={16} className="text-slate-400" /> Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                            placeholder="name@company.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Lock className="text-blue-600" size={20} />
                                    Security & Password
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Key size={16} className="text-slate-400" /> New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                            placeholder="Minimum 8 characters"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Shield size={16} className="text-slate-400" /> Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                                <p className="text-xs text-slate-500">
                                    Last updated: {new Date().toLocaleDateString()}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfileSettings;
