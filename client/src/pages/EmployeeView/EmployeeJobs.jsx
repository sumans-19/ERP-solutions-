import React, { useState, useEffect } from 'react';
import { getAssignedJobs, startStep, completeStep, toggleSubstep, saveStepNote } from '../../services/api';
import { Briefcase, CheckCircle, Circle, Clock, ChevronRight, FileText, AlertTriangle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeJobs = ({ user }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [noteInput, setNoteInput] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (user?.id || user?._id) {
            fetchJobs();
        }
    }, [user]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const userId = user.id || user._id;
            const data = await getAssignedJobs(userId);

            // Transform data to show jobs assigned to this employee
            const jobsList = data.map(item => {
                const assignments = item.assignedEmployees.filter(a => a.employeeId === userId);
                return assignments.map(a => ({
                    ...a,
                    itemCode: item.code,
                    itemName: item.name,
                    itemId: item._id,
                    processDetails: item.processes.find(p => p.id === a.processStepId)
                }));
            }).flat();

            // Sort: In Progress > Pending > Completed
            jobsList.sort((a, b) => {
                const statusOrder = { 'in-progress': 1, 'pending': 2, 'assigned': 2, 'completed': 3, 'failed': 4 };
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
            await startStep(selectedJob.itemId, selectedJob.processStepId);
            fetchJobs();
            setSelectedJob(prev => ({ ...prev, status: 'in-progress' }));
        } catch (error) {
            console.error('Error starting job:', error);
        }
    };

    const handleCompleteJob = async () => {
        if (!selectedJob) return;
        try {
            await completeStep(selectedJob.itemId, selectedJob.processStepId, noteInput);
            fetchJobs();
            setSelectedJob(null);
        } catch (error) {
            console.error('Error completing job:', error);
        }
    };

    const handleToggleSubstep = async (subStepId, currentStatus) => {
        if (!selectedJob) return;
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await toggleSubstep(selectedJob.itemId, selectedJob.processStepId, subStepId, newStatus);

            // Update local state
            setSelectedJob(prev => ({
                ...prev,
                processDetails: {
                    ...prev.processDetails,
                    subSteps: prev.processDetails.subSteps.map(s =>
                        s.id === subStepId ? { ...s, status: newStatus } : s
                    )
                }
            }));
            fetchJobs();
        } catch (error) {
            console.error('Error toggling substep:', error);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedJob) return;
        setSavingNote(true);
        try {
            const userId = user.id || user._id;
            await saveStepNote(selectedJob.itemId, selectedJob.processStepId, noteInput, userId);
            fetchJobs();
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

    if (loading) return <div className="p-8">Loading jobs...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Job List Column */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase size={20} className="text-blue-600" /> My Jobs
                    </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {jobs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No jobs assigned.</div>
                    ) : (
                        jobs.map((job, idx) => (
                            <div
                                key={`${job.itemId}-${job.processStepId}`}
                                onClick={() => handleJobClick(job)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${selectedJob?.processStepId === job.processStepId && selectedJob?.itemId === job.itemId
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-slate-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(job.status)}`}>
                                        {job.status === 'pending' ? 'Assigned' : job.status}
                                    </span>
                                    {job.expectedCompletionDate && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(job.expectedCompletionDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">{job.itemName}</h3>
                                <p className="text-xs text-slate-500">{job.itemCode}</p>
                                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {job.processName}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Job Details Column */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {selectedJob ? (
                    <>
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedJob.itemName}</h2>
                                <p className="text-slate-500 text-sm mt-1">{selectedJob.processName}</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedJob.status === 'assigned' || selectedJob.status === 'pending' ? (
                                    <button
                                        onClick={handleStartJob}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                                    >
                                        Start Job
                                    </button>
                                ) : selectedJob.status === 'in-progress' ? (
                                    <button
                                        onClick={handleCompleteJob}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Complete Job
                                    </button>
                                ) : (
                                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-bold border border-slate-200 cursor-not-allowed">
                                        Job Completed
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            {/* Checklist Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-slate-400" /> Process Checklist
                                </h3>
                                <div className="space-y-3">
                                    {selectedJob.processDetails?.subSteps && selectedJob.processDetails.subSteps.length > 0 ? (
                                        selectedJob.processDetails.subSteps.map(step => (
                                            <div
                                                key={step.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${step.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => handleToggleSubstep(step.id, step.status)}
                                                    disabled={selectedJob.status === 'completed'}
                                                    className={`mt-0.5 flex-shrink-0 transition-colors ${step.status === 'completed' ? 'text-emerald-600' : 'text-slate-300 hover:text-blue-500'
                                                        }`}
                                                >
                                                    {step.status === 'completed' ? <CheckCircle size={20} /> : <Circle size={20} />}
                                                </button>
                                                <div>
                                                    <p className={`text-sm font-medium ${step.status === 'completed' ? 'text-emerald-900 line-through opacity-75' : 'text-slate-900'}`}>{step.name}</p>
                                                    {step.description && <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-sm text-slate-500">
                                            No substeps defined for this process.
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                        className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={selectedJob.status === 'completed' || savingNote}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
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
                        <p className="font-medium">Select a job from the list to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeJobs;
