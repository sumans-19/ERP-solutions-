import React, { useState, useEffect } from 'react';
import { getContacts } from '../services/api';
import { User, ChevronDown } from 'lucide-react';

const EmployeeSelector = ({ selectedEmployeeId, onEmployeeChange }) => {
    const [employees, setEmployees] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await getContacts();
            const emps = data.filter(c => c.type === 'Employee');
            setEmployees(emps);

            // Auto-select first employee if none selected
            if (!selectedEmployeeId && emps.length > 0) {
                onEmployeeChange(emps[0]._id);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedEmployee = employees.find(e => e._id === selectedEmployeeId);

    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                Viewing Employee Data
            </label>
            <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full sm:w-80 flex items-center justify-between gap-3 px-4 py-3 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {selectedEmployee?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-900">
                                {selectedEmployee?.name || 'Select Employee'}
                            </p>
                            <p className="text-xs text-slate-500">{selectedEmployee?.role || 'No employee selected'}</p>
                        </div>
                    </div>
                    <ChevronDown size={20} className="text-slate-400" />
                </button>

                {isDropdownOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-[400px] overflow-y-auto">
                            <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                                Select Employee
                            </div>
                            {loading ? (
                                <div className="px-4 py-3 text-sm text-slate-400">Loading employees...</div>
                            ) : employees.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400 italic">No employees found</div>
                            ) : (
                                employees.map(emp => (
                                    <button
                                        key={emp._id}
                                        onClick={() => {
                                            onEmployeeChange(emp._id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedEmployeeId === emp._id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedEmployeeId === emp._id ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {emp.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${selectedEmployeeId === emp._id ? 'text-blue-700' : 'text-slate-900'}`}>
                                                {emp.name}
                                            </p>
                                            <p className="text-xs text-slate-500">{emp.role}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeSelector;
