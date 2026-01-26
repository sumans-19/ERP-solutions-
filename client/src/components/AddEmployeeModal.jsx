import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

const AddEmployeeModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        phone: '',
        password: '',
        role: 'Worker',
        status: 'Active'
    });

    const roles = [
        'Admin',
        'Manager',
        'Supervisor',
        'Worker',
        'QC Inspector',
        'Dispatcher',
        'Accountant',
        'Sales',
        'Other'
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            employeeId: '',
            email: '',
            phone: '',
            password: '',
            role: 'Worker',
            status: 'Active'
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    {/* Form Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter full name"
                                    value={formData.fullName}
                                    onChange={e => handleChange('fullName', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Employee ID */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Employee ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. EMP001"
                                    value={formData.employeeId}
                                    onChange={e => handleChange('employeeId', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter password (optional)"
                                    value={formData.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Role Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={e => handleChange('role', e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white cursor-pointer"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                'Creating...'
                            ) : (
                                <>
                                    <span className="text-lg">✓</span> Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
