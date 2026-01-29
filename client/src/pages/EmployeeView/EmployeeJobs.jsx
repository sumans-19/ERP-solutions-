import React, { useState, useEffect } from 'react';
import { getJobCardsByEmployee, updateJobCardSteps, toggleJobSubstep } from '../../services/api';
import { Briefcase, CheckCircle, Circle, Clock, ChevronRight, FileText, AlertTriangle, Save, Filter, CheckSquare, Square, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

const EmployeeJobs = ({ user }) => {
    const { selectedEmployeeId } = useEmployeeView();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [noteInput, setNoteInput] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [filter, setFilter] = useState('pending'); // 'pending' or 'completed'

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchJobs();
        }
    }, [selectedEmployeeId]);

    useEffect(() => {
        // Filter jobs based on selected filter
        if (filter === 'completed') {
            setFilteredJobs(jobs.filter(j => j.status === 'completed'));
        } else {
            setFilteredJobs(jobs.filter(j => j.status !== 'completed'));
        }
    }, [jobs, filter]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            console.log('Fetching jobs for employee:', selectedEmployeeId);
            const data = await getJobCardsByEmployee(selectedEmployeeId);
            console.log('Raw API Response:', data);

            // Transform data: one entry per step assigned to this employee
            const jobsList = [];
            data.forEach(job => {
                job.steps.forEach(step => {
                    const stepEmpId = step.employeeId?._id || step.employeeId;
                    const isMatch = String(stepEmpId) === String(selectedEmployeeId);

                    if (isMatch) {
                        jobsList.push({
                            jobCardId: job._id,
                            jobNumber: job.jobNumber,
                            itemId: job.itemId?._id,
                            itemName: job.itemId?.name || 'Unknown Item',
                            itemCode: job.itemId?.code || '',
                            quantity: job.quantity,
                            stepId: step.stepId,
                            stepName: step.stepName,
                            status: step.status,
                            startTime: step.startTime,
                            endTime: step.endTime,
                            partyName: job.orderId?.partyName || 'Unknown Party',
                            poNumber: job.orderId?.poNumber || '',
                            priority: job.priority || 'Normal',
                            deliveryDate: job.deliveryDate,
                            targetStartDate: step.targetStartDate,
                            targetDeadline: step.targetDeadline,
                            allSteps: job.steps, // Keep for updating all steps
                            subSteps: step.subSteps || []
                        });
                    }
                });
            });
            console.log('Processed Jobs List:', jobsList);

            // Sort: In Progress > Pending > Completed
            jobsList.sort((a, b) => {
                const statusOrder = { 'in-progress': 1, 'pending': 2, 'completed': 3 };
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            });

            setJobs(jobsList);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJobClick = (job) => {
        setSelectedJob(job);
        setNoteInput(job.notes || '');
    };

    const handleStartJob = async () => {
        if (!selectedJob) return;
        try {
            const updatedSteps = selectedJob.allSteps.map(s =>
                (s.stepId === selectedJob.stepId && String(s.employeeId?._id || s.employeeId) === String(selectedEmployeeId))
                    ? { ...s, status: 'in-progress', startTime: new Date() }
                    : s
            );
            await updateJobCardSteps(selectedJob.jobCardId, updatedSteps);
            await fetchJobs();
            // Update selected job local state
            setSelectedJob(prev => ({ ...prev, status: 'in-progress', startTime: new Date(), allSteps: updatedSteps }));
        } catch (error) {
            console.error('Error starting job:', error);
            if (error.response) {
                console.error('Server error details:', error.response.data);
                alert(`Error starting job: ${error.response.data.message || 'Unknown error'}`);
            }
        }
    };

    const handleCompleteJob = async () => {
        if (!selectedJob) return;
        try {
            const updatedSteps = selectedJob.allSteps.map(s =>
                (s.stepId === selectedJob.stepId && String(s.employeeId?._id || s.employeeId) === String(selectedEmployeeId))
                    ? { ...s, status: 'completed', endTime: new Date() }
                    : s
            );
            await updateJobCardSteps(selectedJob.jobCardId, updatedSteps);
            await fetchJobs();
            setSelectedJob(null);
        } catch (error) {
            console.error('Error completing job:', error);
        }
    };

    const handleToggleSubstep = async (subStepId, currentStatus) => {
        if (!selectedJob || selectedJob.status === 'completed') return;

        // Determine new status
        // If current is completed, we move to pending
        // If current is pending, we move to completed
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        try {
            await toggleJobSubstep(selectedJob.jobCardId, selectedJob.stepId, subStepId, newStatus);

            // Update local state for immediate feedback
            setSelectedJob(prev => ({
                ...prev,
                subSteps: prev.subSteps.map(ss =>
                    ss.id === subStepId ? { ...ss, status: newStatus } : ss
                )
            }));

            // Refresh job list in background
            fetchJobs();
        } catch (error) {
            console.error('Error toggling substep:', error);
            alert('Failed to update substep. Please try again.');
        }
    };

    const handleSaveNote = async () => {
        if (!selectedJob) return;
        setSavingNote(true);
        try {
            await saveStepNote(selectedJob.itemId, selectedJob.processStepId, noteInput, selectedEmployeeId);
            await fetchJobs();
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setSavingNote(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-800';
            case 'in-progress': return 'bg-amber-100 text-amber-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
            case 'assigned': return 'Assigned';
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'failed': return 'Failed';
            default: return status;
        }
    };

    if (!selectedEmployeeId) {
        return null; // Layout handles empty state
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading jobs...</div>;
    }

    return (
        <div className="space-y-4 sm:space-y-6 h-full overflow-hidden flex flex-col">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Jobs</h2>
                    <p className="text-sm text-slate-500">Manufacturing tasks assigned to you</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'pending'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Pending ({jobs.filter(j => j.status !== 'completed').length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'completed'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Completed ({jobs.filter(j => j.status === 'completed').length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 overflow-hidden">
                {/* Job List Column */}
                <div className="lg:col-span-1 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px] lg:max-h-full">
                    <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase size={20} className="text-blue-600" />
                            {filter === 'completed' ? 'Completed Jobs' : 'Pending Jobs'}
                        </h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {filteredJobs.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No {filter} jobs found.
                            </div>
                        ) : (
                            filteredJobs.map((job, idx) => (
                                <div
                                    key={`${job.jobCardId}-${job.stepId}`}
                                    onClick={() => handleJobClick(job)}
                                    className={`p-3 sm:p-4 rounded-md border cursor-pointer transition-all hover:bg-slate-50 ${selectedJob?.stepId === job.stepId && selectedJob?.jobCardId === job.jobCardId
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-slate-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(job.status)} whitespace-nowrap`}>
                                            {getStatusLabel(job.status)}
                                        </span>
                                        {job.expectedCompletionDate && (
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(job.expectedCompletionDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">{job.itemName}</h3>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                                        <span>{job.partyName}</span>
                                        <span>PO: {job.poNumber}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{job.itemCode}</p>
                                    <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                            <span className="truncate">{job.stepName}</span>
                                        </div>
                                        <span className="text-slate-400 font-mono">{job.jobNumber}</span>
                                    </div>
                                    {job.completedAt && (
                                        <p className="text-xs text-emerald-600 mt-2">
                                            Completed: {new Date(job.completedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Job Details Column */}
                <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[600px] lg:max-h-full">
                    {selectedJob ? (
                        <>
                            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 flex-shrink-0">
                                <div className="min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{selectedJob.itemName}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-slate-500 text-sm truncate">{selectedJob.stepName}</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200">{selectedJob.jobNumber}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Order: {selectedJob.partyName} ({selectedJob.poNumber})</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {selectedJob.status === 'assigned' || selectedJob.status === 'pending' ? (
                                        <button
                                            onClick={handleStartJob}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap"
                                        >
                                            Start Job
                                        </button>
                                    ) : selectedJob.status === 'in-progress' ? (
                                        <button
                                            onClick={handleCompleteJob}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <CheckCircle size={16} /> Complete Job
                                        </button>
                                    ) : (
                                        <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-md text-sm font-bold border border-slate-200 cursor-not-allowed whitespace-nowrap">
                                            Job Completed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 sm:space-y-8">
                                {/* Checklist Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-slate-400" /> Manufacturing Details
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-md border border-slate-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Customer</span>
                                                <span className="text-sm font-bold text-slate-900 truncate block">{selectedJob.partyName}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PO Number</span>
                                                <span className="text-sm font-bold text-slate-900 truncate block">{selectedJob.poNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Start By</span>
                                                <span className="text-xs font-bold text-blue-600 block truncate">
                                                    {selectedJob.targetStartDate ? new Date(selectedJob.targetStartDate).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deadline</span>
                                                <span className="text-xs font-bold text-red-500 block truncate">
                                                    {selectedJob.targetDeadline ? new Date(selectedJob.targetDeadline).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Batch Quantity</span>
                                                <span className="text-lg font-bold text-slate-900">{selectedJob.quantity} UNIT</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Step Status</span>
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(selectedJob.status)}`}>
                                                    {getStatusLabel(selectedJob.status)}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedJob.startTime && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Started At</span>
                                                <span className="text-sm text-slate-700">{new Date(selectedJob.startTime).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Substeps Checklist */}
                                {selectedJob.subSteps && selectedJob.subSteps.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckSquare size={16} className="text-blue-500" /> Process Checkpoints
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedJob.subSteps.map((ss) => (
                                                <div
                                                    key={ss.id}
                                                    onClick={() => handleToggleSubstep(ss.id, ss.status)}
                                                    className={`flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer group ${ss.status === 'completed'
                                                        ? 'bg-emerald-50 border-emerald-100'
                                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {ss.status === 'completed' ? (
                                                            <CheckSquare size={20} className="text-emerald-600" />
                                                        ) : (
                                                            <Square size={20} className="text-slate-300 group-hover:text-blue-400" />
                                                        )}
                                                        <div>
                                                            <span className={`text-sm font-bold ${ss.status === 'completed' ? 'text-emerald-900 line-through opacity-60' : 'text-slate-700'}`}>
                                                                {ss.name}
                                                            </span>
                                                            {ss.description && (
                                                                <p className="text-[10px] text-slate-400 font-medium">{ss.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {ss.status === 'completed' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Done</span>
                                                            <XCircle
                                                                size={14}
                                                                className="text-emerald-400 hover:text-rose-500 transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleSubstep(ss.id, 'completed'); // Toggles back to pending
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" /> Job Notes
                                    </h3>
                                    <div className="space-y-2">
                                        <textarea
                                            value={noteInput}
                                            onChange={(e) => setNoteInput(e.target.value)}
                                            disabled={selectedJob.status === 'completed'}
                                            placeholder="Add notes, observations, or issues here..."
                                            rows="4"
                                            className="w-full p-3 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSaveNote}
                                                disabled={selectedJob.status === 'completed' || savingNote}
                                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <Save size={16} /> {savingNote ? 'Saving...' : 'Save Note'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Briefcase size={32} />
                            </div>
                            <p className="font-medium text-center">Select a job from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeJobs;

