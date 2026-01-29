import React, { useState, useEffect } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../../services/taskApi';
import { getEmployees } from '../../services/employeeApi';
import { Plus, Trash2, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TodoListPage = () => {
    const [todos, setTodos] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newTask, setNewTask] = useState({
        taskName: '',
        date: new Date().toISOString().slice(0, 10),
        deadlineDate: '',
        assignedTo: '',
        status: 'Pending'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [todosData, employeesData] = await Promise.all([getTodos(), getEmployees()]);
            setTodos(todosData);
            setEmployees(employeesData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const assignedEmp = employees.find(e => e._id === newTask.assignedTo);
            const todoData = {
                ...newTask,
                assignmentName: assignedEmp ? assignedEmp.fullName : 'Unassigned'
            };
            if (assignedEmp) todoData.assignmentName = assignedEmp.fullName;

            await createTodo(todoData);
            setNewTask({
                taskName: '',
                date: new Date().toISOString().slice(0, 10),
                deadlineDate: '',
                assignedTo: '',
                status: 'Pending'
            });
            fetchData();
        } catch (error) {
            console.error("Error creating todo:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTodo(id);
                setTodos(todos.filter(t => t._id !== id));
            } catch (error) {
                console.error("Error deleting todo:", error);
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateTodo(id, { status: newStatus });
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return <div className="p-8 text-center">Loading tasks...</div>;

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">To-Do List</h2>
                    <p className="text-slate-500">Manage daily tasks and assignments</p>
                </div>
            </div>

            {/* Add New Task Form */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Task Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter task description..."
                            value={newTask.taskName}
                            onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={newTask.date}
                            onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none"
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Deadline</label>
                        <input
                            type="date"
                            value={newTask.deadlineDate}
                            onChange={e => setNewTask({ ...newTask, deadlineDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none"
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Assign To</label>
                        <select
                            value={newTask.assignedTo}
                            onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none bg-white"
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition"
                    >
                        <Plus size={18} /> Add
                    </button>
                </form>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-md shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600 text-sm">Task Name</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm w-32">Date</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm w-32">Deadline</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm w-48">Assigned To</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm w-32">Status</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm w-20 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {todos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                        No tasks found. Add one above!
                                    </td>
                                </tr>
                            ) : (
                                todos.map(todo => (
                                    <tr key={todo._id} className="hover:bg-slate-50/50 group">
                                        <td className="p-4 text-slate-800 font-medium">{todo.taskName}</td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            {new Date(todo.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            {todo.deadlineDate ? (
                                                <span className={`${new Date(todo.deadlineDate) < new Date() && todo.status !== 'Completed' ? 'text-red-600 font-medium' : ''}`}>
                                                    {new Date(todo.deadlineDate).toLocaleDateString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {todo.assignmentName ? (
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {todo.assignmentName.charAt(0)}
                                                    </div>
                                                    {todo.assignmentName}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={todo.status}
                                                onChange={(e) => handleStatusChange(todo._id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${getStatusColor(todo.status)}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Overdue">Overdue</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDelete(todo._id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TodoListPage;

