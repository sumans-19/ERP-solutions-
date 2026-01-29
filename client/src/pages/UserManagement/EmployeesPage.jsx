import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee } from '../../services/employeeApi';
import AddEmployeeModal from '../../components/AddEmployeeModal';
import EditEmployeeModal from '../../components/EditEmployeeModal';
import { Search, Users, PlusCircle, Mail, Phone, Briefcase, Edit2 } from 'lucide-react';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch employees", error);
            setLoading(false);
        }
    };

    const handleAddEmployee = async (formData) => {
        setIsSubmitting(true);
        try {
            await createEmployee(formData);
            await fetchEmployees();
            setIsAddModalOpen(false);
            alert('Employee added successfully!');
        } catch (error) {
            console.error("Failed to add employee", error);
            alert(error.response?.data?.message || "Failed to add employee");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setIsEditModalOpen(true);
    };

    const handleUpdateEmployee = async (employeeId, formData) => {
        setIsSubmitting(true);
        try {
            await updateEmployee(employeeId, formData);
            await fetchEmployees();
            setIsEditModalOpen(false);
            alert('Employee updated successfully!');
        } catch (error) {
            console.error("Failed to update employee", error);
            alert(error.response?.data?.message || "Failed to update employee");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Employees...</div>;

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users size={24} className="text-blue-600" />
                        Employees
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage employee information and roles</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition shadow-sm flex items-center gap-2"
                >
                    <PlusCircle size={18} />
                    Add Employee
                </button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
            </div>

            {/* Employees Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Users size={48} className="mx-auto mb-3 text-slate-300" />
                        <p>No employees found</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredEmployees.map(emp => (
                            <div
                                key={emp._id}
                                className="bg-white border border-slate-200 rounded-md p-5 hover:shadow-sm transition-all flex items-center justify-between gap-6 group"
                            >
                                {/* 1. Employee Identity */}
                                <div className="min-w-[280px] w-1/4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                        {emp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{emp.fullName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                                                {emp.employeeId}
                                            </span>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md uppercase tracking-wider italic">
                                                {emp.role || 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Contact Details */}
                                <div className="flex-1 max-w-[350px] border-l border-slate-100 pl-6 space-y-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="p-1.5 bg-blue-50 rounded-md">
                                            <Mail size={14} className="text-blue-600" />
                                        </div>
                                        <span className="font-semibold truncate">{emp.email || 'No Email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <div className="p-1.5 bg-slate-50 rounded-md">
                                            <Phone size={14} className="text-slate-400" />
                                        </div>
                                        <span className="font-medium">{emp.phone || 'No Phone'}</span>
                                    </div>
                                </div>

                                {/* 3. Workload Status */}
                                <div className="w-1/4 text-center border-x border-slate-100 px-6">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-2">Workload Status</p>
                                    <div className="inline-flex items-center gap-3">
                                        <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${emp.calculatedStatus === 'Available'
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full animate-pulse ${emp.calculatedStatus === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {emp.calculatedStatus || 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Status & Management */}
                                <div className="flex items-center gap-4 min-w-[150px] justify-end">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${emp.status === 'Active'
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                                    >
                                        {emp.status}
                                    </div>
                                    <button
                                        onClick={() => handleEditEmployee(emp)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:text-white hover:bg-blue-600 rounded-md transition-all shadow-sm border border-slate-100"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddEmployee}
                isSubmitting={isSubmitting}
            />
            <EditEmployeeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                employee={selectedEmployee}
                onSubmit={handleUpdateEmployee}
            />
        </div>
    );
};

export default EmployeesPage;

