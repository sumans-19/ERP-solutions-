import React, { useState, useEffect } from 'react';
import { Shield, ChevronRight, User, CheckCircle2, XCircle, Search, Save, AlertCircle } from 'lucide-react';
import { getEmployees, updateEmployee } from '../../services/employeeApi';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

const IndividualPermissions = () => {
    const { showNotification } = useNotification();
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const SECTIONS = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'items', label: 'Item Management' },
        { id: 'orders', label: 'Order Management' },
        { id: 'production', label: 'Production Control' },
        { id: 'inventory', label: 'Inventory Management' },
        { id: 'users', label: 'User Management' },
        { id: 'reports', label: 'Reports & Analytics' },
        { id: 'tasks-todo', label: 'To-Do List' },
        { id: 'tasks-followups', label: 'Follow-ups' },
        { id: 'calendar', label: 'Production Calendar' },
        { id: 'company-info', label: 'Company Settings' }
    ];

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleEmployeeSelect = (emp) => {
        // Initialize permissions if not present
        const permissions = SECTIONS.map(sec => {
            const existing = emp.individualPermissions?.find(p => p.section === sec.id);
            return {
                section: sec.id,
                label: sec.label,
                visibility: existing ? existing.visibility : true,
                actions: existing ? existing.actions : { create: true, read: true, update: true, delete: true }
            };
        });
        setSelectedEmp({ ...emp, permissions });
    };

    const togglePermission = (sectionId) => {
        const updatedPerms = selectedEmp.permissions.map(p =>
            p.section === sectionId ? { ...p, visibility: !p.visibility } : p
        );
        setSelectedEmp({ ...selectedEmp, permissions: updatedPerms });
    };

    const toggleAction = (sectionId, action) => {
        const updatedPerms = selectedEmp.permissions.map(p => {
            if (p.section === sectionId) {
                return {
                    ...p,
                    actions: { ...p.actions, [action]: !p.actions[action] }
                };
            }
            return p;
        });
        setSelectedEmp({ ...selectedEmp, permissions: updatedPerms });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateEmployee(selectedEmp._id, {
                individualPermissions: selectedEmp.permissions
            });
            showNotification(`Permissions updated for ${selectedEmp.fullName}`);
            fetchEmployees(); // Refresh list
        } catch (error) {
            showNotification('Failed to update permissions', 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Access Control...</div>;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Shield className="text-blue-600" size={32} />
                    Individual Access Control
                </h1>
                <p className="text-slate-500 mt-2">Manage specific module visibility and actions for individual employees</p>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Employee List Sidebar */}
                <div className="lg:col-span-4 flex flex-col min-h-0 bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredEmployees.map(emp => (
                            <button
                                key={emp._id}
                                onClick={() => handleEmployeeSelect(emp)}
                                className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${selectedEmp?._id === emp._id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-lg ${selectedEmp?._id === emp._id ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {emp.fullName.charAt(0)}
                                </div>
                                <div className="text-left flex-1 truncate">
                                    <p className="font-bold text-sm truncate">{emp.fullName}</p>
                                    <p className={`text-xs ${selectedEmp?._id === emp._id ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {emp.role} • {emp.employeeId}
                                    </p>
                                </div>
                                <ChevronRight size={16} className={selectedEmp?._id === emp._id ? 'opacity-100' : 'opacity-30'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Panel */}
                <div className="lg:col-span-8 flex flex-col min-h-0 bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
                    {!selectedEmp ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <User size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Employee Selected</h3>
                            <p className="text-sm text-center max-w-xs mt-2">Select an employee from the sidebar to manage their custom permissions.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900">Custom Permissions: {selectedEmp.fullName}</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Individual Overrides Enabled</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-200 disabled:bg-slate-300"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                                    Save Access Rules
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <AnimatePresence mode="wait">

                                </AnimatePresence>

                                <div className="space-y-4">
                                    {selectedEmp.permissions.map((perm) => (
                                        <div
                                            key={perm.section}
                                            className={`p-4 rounded-md border transition-all ${perm.visibility
                                                ? 'bg-white border-slate-200'
                                                : 'bg-slate-50 border-slate-100 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${perm.visibility ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'
                                                        }`}>
                                                        <Shield size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{perm.label}</h4>
                                                        <p className="text-[10px] text-slate-500 font-medium">Configure visibility and action rights</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${perm.visibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                                        }`}>
                                                        {perm.visibility ? 'Visible' : 'Hidden'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePermission(perm.section)}
                                                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${perm.visibility ? 'bg-blue-600' : 'bg-slate-300'
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${perm.visibility ? 'right-1' : 'left-1'
                                                            }`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {perm.visibility && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                                                    {Object.entries(perm.actions).map(([action, enabled]) => (
                                                        <button
                                                            key={action}
                                                            onClick={() => toggleAction(perm.section, action)}
                                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all border ${enabled
                                                                ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm'
                                                                : 'bg-white text-slate-300 border-slate-100 grayscale'
                                                                }`}
                                                        >
                                                            {enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                            {action}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IndividualPermissions;

