import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle, AlertCircle, Calendar, Users, Coffee, LogIn, LogOut } from 'lucide-react';
import { getEmployees, updateEmployee } from '../../services/employeeApi';
import { motion } from 'framer-motion';

const ShiftTimeSettings = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Global Timing
    const [globalShift, setGlobalShift] = useState({
        startTime: '09:00',
        endTime: '18:00',
        breakTime: '13:00'
    });

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

    const handleEmployeeShiftChange = (empId, field, value) => {
        setEmployees(employees.map(emp => {
            if (emp._id === empId) {
                const updatedShift = { ...(emp.workShift || globalShift), [field]: value };
                return { ...emp, workShift: updatedShift };
            }
            return emp;
        }));
    };

    const saveEmployeeShift = async (emp) => {
        setSaving(true);
        try {
            await updateEmployee(emp._id, { workShift: emp.workShift });
            setMessage({ type: 'success', text: `Shift updated for ${emp.fullName}` });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update shift' });
        } finally {
            setSaving(false);
        }
    };

    const applyGlobalToAll = () => {
        if (window.confirm('Apply these timings to ALL employees? This will overwrite individual settings.')) {
            setEmployees(employees.map(emp => ({ ...emp, workShift: { ...globalShift } })));
            setMessage({ type: 'success', text: 'Global shift applied to local list. Click save on individual employees to sync with server.' });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Shift Management...</div>;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col h-full">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Clock className="text-blue-600" size={32} />
                    Shift & Time Management
                </h1>
                <p className="text-slate-500 mt-2">Configure working hours and break schedules for the organization</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-6 p-4 rounded-md flex items-center gap-3 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold">{message.text}</span>
                </motion.div>
            )}

            {/* Global Configuration Card */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 mb-8 mt-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Global Shift Policy</h3>
                            <p className="text-xs text-slate-500">Standard working hours for new recruits and general staff</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <LogIn size={10} /> Start Time
                            </label>
                            <input
                                type="time"
                                value={globalShift.startTime}
                                onChange={e => setGlobalShift({ ...globalShift, startTime: e.target.value })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Coffee size={10} /> Break
                            </label>
                            <input
                                type="time"
                                value={globalShift.breakTime}
                                onChange={e => setGlobalShift({ ...globalShift, breakTime: e.target.value })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <LogOut size={10} /> End Time
                            </label>
                            <input
                                type="time"
                                value={globalShift.endTime}
                                onChange={e => setGlobalShift({ ...globalShift, endTime: e.target.value })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={applyGlobalToAll}
                            className="h-10 px-4 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition shadow-sm shadow-slate-200"
                        >
                            Apply to All
                        </button>
                    </div>
                </div>
            </div>

            {/* Employee Specific Settings */}
            <div className="flex-1 bg-white rounded-md shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700">Individual Shift Adjustments</h3>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="border-b border-slate-100">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Break Time</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {emp.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900">{emp.fullName}</p>
                                                <p className="text-[10px] text-slate-500">{emp.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="time"
                                            value={emp.workShift?.startTime || '09:00'}
                                            onChange={e => handleEmployeeShiftChange(emp._id, 'startTime', e.target.value)}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="time"
                                            value={emp.workShift?.breakTime || '13:00'}
                                            onChange={e => handleEmployeeShiftChange(emp._id, 'breakTime', e.target.value)}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="time"
                                            value={emp.workShift?.endTime || '18:00'}
                                            onChange={e => handleEmployeeShiftChange(emp._id, 'endTime', e.target.value)}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                                        />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => saveEmployeeShift(emp)}
                                            disabled={saving}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Save for this employee"
                                        >
                                            <Save size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShiftTimeSettings;

