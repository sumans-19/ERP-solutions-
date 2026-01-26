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
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm flex items-center gap-2"
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEmployees.map(emp => (
                            <div
                                key={emp._id}
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {emp.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{emp.fullName}</h3>
                                            <p className="text-xs text-slate-500">{emp.employeeId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditEmployee(emp)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit Employee"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${emp.status === 'Active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {emp.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {emp.email && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={14} className="text-slate-400" />
                                            <span className="truncate">{emp.email}</span>
                                        </div>
                                    )}
                                    {emp.phone && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={14} className="text-slate-400" />
                                            {emp.phone}
                                        </div>
                                    )}
                                    {emp.role && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Briefcase size={14} className="text-slate-400" />
                                            {emp.role}
                                        </div>
                                    )}
                                    {emp.calculatedStatus && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${emp.calculatedStatus === 'Available'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.calculatedStatus === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`} />
                                                {emp.calculatedStatus}
                                            </span>
                                        </div>
                                    )}
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
