import React, { useState, useEffect } from 'react';
import {
    Shield, Save, RefreshCcw, Eye, EyeOff,
    Lock, CheckSquare, Square, ChevronRight,
    Users, Package, ShoppingCart, Activity, Archive, BarChart3, MessageSquare, Briefcase,
    LayoutDashboard, UserCog, Settings, User
} from 'lucide-react';
import { getRolePermissions, updateRolePermissions } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Preferences = ({ user }) => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Section Configuration Mapping
    const sectionIcons = {
        'items': Package,
        'orders': ShoppingCart,
        'process': Activity,
        'inventory': Archive,
        'users': Users,
        'reports': BarChart3,
        'comm-hub': MessageSquare,
        'tasks': Briefcase,
        'jobs': Activity,
        'admin-view': Shield,
        'employee-view': Users,
        'planning-view': BarChart3,
        'dashboard': LayoutDashboard,
        'profile-settings': UserCog,
        'system-settings': Settings
    };

    useEffect(() => {
        if (user?.role === 'development') {
            fetchPermissions();
        }
    }, [user]);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const data = await getRolePermissions();
            setRoles(data);
            if (data.length > 0 && !selectedRole) {
                setSelectedRole(data[0]);
            } else if (selectedRole) {
                // Update selected role if it was already selected
                const updated = data.find(r => r.role === selectedRole.role);
                setSelectedRole(updated);
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = (sectionName) => {
        const updatedPermissions = selectedRole.permissions.map(p =>
            p.section === sectionName ? { ...p, visibility: !p.visibility } : p
        );
        setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    };

    const handleToggleAction = (sectionName, action) => {
        const updatedPermissions = selectedRole.permissions.map(p =>
            p.section === sectionName
                ? { ...p, actions: { ...p.actions, [action]: !p.actions[action] } }
                : p
        );
        setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateRolePermissions(selectedRole.role, { permissions: selectedRole.permissions });
            alert(`Permissions updated for ${selectedRole.role} role.`);
            fetchPermissions();
        } catch (error) {
            alert('Failed to update permissions: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    if (user?.role !== 'development') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
                <p className="text-slate-500 max-w-sm">This "Supreme Authority" panel is exclusively reserved for the Development Team level access.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Security Protocols...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200">
                                <Shield size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supreme Authority</h1>
                        </div>
                        <p className="text-slate-600 font-medium">Fine-grained access control and universal system preferences manager.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchPermissions}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            title="Refresh Protocols"
                        >
                            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-slate-200 group"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save size={18} className="group-hover:scale-110 transition-transform" />
                            )}
                            COMMIT MASTER CHANGES
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Role Selection Sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Roles</h3>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">{roles.length}</span>
                        </div>
                        <div className="space-y-2">
                            {roles.length === 0 && (
                                <p className="text-xs text-slate-400 italic p-4 text-center">No roles initialized.</p>
                            )}
                            {roles.map(role => (
                                <button
                                    key={role.role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full group relative flex flex-col items-start p-4 rounded-2xl transition-all border-2 ${selectedRole?.role === role.role
                                        ? 'bg-white border-blue-600 shadow-xl shadow-blue-50'
                                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className={`capitalize font-bold text-base ${selectedRole?.role === role.role ? 'text-blue-600' : 'text-slate-700'}`}>
                                            {role.role}
                                        </span>
                                        {selectedRole?.role === role.role && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium text-left">
                                        {role.role === 'admin' && 'Full administrative authority levels.'}
                                        {role.role === 'planning' && 'Operational scheduling and logistics.'}
                                        {role.role === 'employee' && 'Standard utility and task tracking.'}
                                        {!['admin', 'planning', 'employee'].includes(role.role) && 'Custom system access level.'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Security Warning Box */}
                        <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <AlertTriangle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Protocol Warning</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Changes to visibility will immediately remove access for the target role across the entire workforce.
                                <span className="text-slate-900 font-bold block mt-1">Exercise absolute caution.</span>
                            </p>
                        </div>
                    </div>

                    {/* Permissions Workspace */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-slate-900 capitalize">{selectedRole?.role} Scope</h2>
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Active Level</span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">Fine-tune exact visibility and operation boundaries.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Section Module</th>
                                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Visibility</th>
                                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Create</th>
                                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Read / View</th>
                                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Update / Edit</th>
                                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedRole?.permissions.map((perm) => {
                                            const Icon = sectionIcons[perm.section] || Shield;
                                            return (
                                                <tr key={perm.section} className="hover:bg-slate-50/70 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2.5 rounded-xl transition-colors ${perm.visibility ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                <Icon size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 capitalize text-sm tracking-tight">{perm.section.replace('-', ' ')}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Segment</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Visibility Toggle */}
                                                    <td className="px-4 py-6 text-center">
                                                        <button
                                                            onClick={() => handleToggleVisibility(perm.section)}
                                                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${perm.visibility
                                                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 ring-4 ring-blue-50/50'
                                                                : 'text-slate-300 bg-slate-50 hover:bg-slate-100'
                                                                }`}
                                                            title="Toggle Visibility"
                                                        >
                                                            {perm.visibility ? <Eye size={18} /> : <EyeOff size={18} />}
                                                        </button>
                                                    </td>

                                                    {/* CRUD Actions with standardized Checkboxes */}
                                                    {['create', 'read', 'update', 'delete'].map(action => (
                                                        <td key={action} className="px-4 py-6 text-center">
                                                            <div className="flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={perm.actions[action]}
                                                                    onChange={() => handleToggleAction(perm.section, action)}
                                                                    className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-all cursor-pointer accent-blue-600"
                                                                />
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Integration Hint */}
                        <p className="mt-6 text-[11px] text-slate-400 font-medium text-center italic">
                            System Tip: Visibility is the master switch. Disabling it prevents even Read operations from executing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AlertTriangle = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export default Preferences;
