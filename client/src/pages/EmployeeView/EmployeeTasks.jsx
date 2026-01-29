import React, { useState, useEffect } from 'react';
import { getEmployeeTodos, updateTodo } from '../../services/taskApi'; // Updated import
import { CheckCircle, Circle, Clock, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

const EmployeeTasks = ({ user }) => {
    const { selectedEmployeeId } = useEmployeeView();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchTasks();
        }
    }, [selectedEmployeeId]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await getEmployeeTodos(selectedEmployeeId);
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
            await updateTodo(task._id, { status: newStatus });

            // Optimistic update
            setTasks(prev => prev.map(t =>
                t._id === task._id ? { ...t, status: newStatus } : t
            ));
        } catch (error) {
            console.error('Error updating task:', error);
            fetchTasks(); // Revert on error
        }
    };

    const handleSaveNote = async (taskId) => {
        // Todo model might not have 'notes' field yet, but we'll try to update it.
        // If we need notes, we should add it to the schema.
        // For now, let's assume we can add it or just log it.
        console.log("Notes feature requiring schema update");
        /*
        try {
            await updateTodo(taskId, { notes: noteInput });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, notes: noteInput } : t));
            setExpandedTaskId(null);
            setNoteInput('');
        } catch (error) {
            console.error('Error saving note:', error);
        }
        */
    };

    const toggleExpand = (task) => {
        if (expandedTaskId === task._id) {
            setExpandedTaskId(null);
            setNoteInput('');
        } else {
            setExpandedTaskId(task._id);
            setNoteInput(task.notes || '');
        }
    };

    const filteredTasks = tasks.filter(t =>
        filter === 'Completed' ? t.status === 'Completed' : t.status !== 'Completed'
    );

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    if (!selectedEmployeeId) {
        return null; // Layout handles empty state
    }

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 h-full overflow-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tasks</h1>
                    <p className="text-sm sm:text-base text-slate-500">Manage assigned administrative tasks</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md w-full sm:w-auto">
                    {['Pending', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-md border border-dashed border-slate-300 p-8 sm:p-12 text-center"
                        >
                            <p className="text-slate-500">No {filter.toLowerCase()} tasks found.</p>
                        </motion.div>
                    ) : (
                        filteredTasks.map(task => (
                            <motion.div
                                key={task._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white rounded-md border transition-all ${task.status === 'Completed' ? 'border-slate-200 opacity-75' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
                                    }`}
                            >
                                <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                                    <button
                                        onClick={() => handleToggleComplete(task)}
                                        className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'Completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'
                                            }`}
                                    >
                                        {task.status === 'Completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                            <div className="min-w-0 flex-1">
                                                <h3 className={`text-base sm:text-lg font-bold text-slate-900 ${task.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                                                    {task.taskName}
                                                </h3>
                                                <p className="text-slate-500 text-sm mt-1">{task.assignmentName !== 'Unassigned' ? `Assigned to: ${task.assignmentName}` : ''}</p>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap self-start ${task.status === 'Overdue' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
                                                {task.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs text-slate-500">
                                            {task.deadlineDate && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>Due: {new Date(task.deadlineDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">Date:</span> {new Date(task.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleExpand(task)}
                                        className={`p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 ${expandedTaskId === task._id ? 'bg-slate-100 text-blue-600' : ''}`}
                                    >
                                        {expandedTaskId === task._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {expandedTaskId === task._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                                        >
                                            <div className="p-4 sm:p-5">
                                                <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                                                    <FileText size={14} /> NOTES & UPDATE
                                                </label>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={noteInput}
                                                        onChange={(e) => setNoteInput(e.target.value)}
                                                        placeholder="Add a note or update..."
                                                        className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveNote(task._id)}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EmployeeTasks;

