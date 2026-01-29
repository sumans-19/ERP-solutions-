import React, { useState, useEffect } from 'react';
import { getContacts, createTask, getEmployeeTasks, deleteTask } from '../../services/api';
import { UserPlus, Calendar, AlertCircle, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TaskAssignment = ({ user }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: ''
    });
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            fetchEmployeeTasks(selectedEmployee);
        }
    }, [selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            const data = await getContacts();
            const emps = data.filter(c => c.type === 'Employee');
            setEmployees(emps);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchEmployeeTasks = async (employeeId) => {
        try {
            setLoading(true);
            const data = await getEmployeeTasks(employeeId);
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) {
            alert('Please select an employee');
            return;
        }

        setSubmitting(true);
        try {
            await createTask({
                employeeId: selectedEmployee,
                ...taskForm
            });

            // Reset form
            setTaskForm({
                title: '',
                description: '',
                priority: 'Medium',
                dueDate: ''
            });

            // Refresh tasks
            fetchEmployeeTasks(selectedEmployee);
            alert('Task assigned successfully!');
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to assign task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await deleteTask(taskId);
            fetchEmployeeTasks(selectedEmployee);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Task Assignment</h1>
                <p className="text-slate-500">Assign and manage employee tasks</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Assignment Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 sticky top-6">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-blue-600" /> Assign New Task
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Select Employee *
                                </label>
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">Choose an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} - {emp.role}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., Update inventory records"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    rows="3"
                                    className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Task details..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Priority
                                </label>
                                <select
                                    value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={taskForm.dueDate}
                                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                    className="w-full p-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition disabled:bg-slate-400"
                            >
                                {submitting ? 'Assigning...' : 'Assign Task'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Task List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {selectedEmployee ? (
                            <>Tasks for {employees.find(e => e._id === selectedEmployee)?.name}</>
                        ) : (
                            'Select an employee to view tasks'
                        )}
                    </h3>

                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading tasks...</div>
                    ) : !selectedEmployee ? (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-md p-12 text-center">
                            <UserPlus size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">Select an employee to view and manage their tasks</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-300 rounded-md p-12 text-center">
                            <p className="text-slate-500">No tasks assigned yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map(task => (
                                <motion.div
                                    key={task._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-5 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-2">
                                                {task.status === 'Completed' ? (
                                                    <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <Clock size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div className="flex-1">
                                                    <h4 className={`font-bold text-slate-900 ${task.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                                                        {task.title}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-slate-500 ml-8">
                                                <span className={`px-2 py-0.5 rounded-full border font-bold ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full ${task.status === 'Completed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>

                                            {task.notes && (
                                                <div className="mt-3 ml-8 p-3 bg-slate-50 rounded-md border border-slate-100">
                                                    <p className="text-xs text-slate-600 italic">Note: {task.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleDeleteTask(task._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete task"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskAssignment;

