import React, { useState, useEffect } from 'react';
import {
    getJobCardsByEmployee,
    getOpenJobs,
    acceptOpenJob,
    executeProductionStep,
    submitFQCResults,
    getJobCardById,
    toggleJobSubstep,
    getJobCardsByStage,
    completeOutwardWork
} from '../../services/api';
import {
    Briefcase, CheckCircle, Circle, Clock, ChevronRight, FileText,
    AlertTriangle, Layout, List, ClipboardList, CheckCircle2, AlertCircle, Calendar, Users,
    ArrowRight, Play, Trash2, ClipboardCheck,
    Search, Filter, Package, ShoppingBag, ArrowLeftRight, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

const EmployeeJobs = ({ user }) => {
    const { selectedEmployeeId } = useEmployeeView();
    const [jobs, setJobs] = useState([]);
    const [openJobs, setOpenJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned', 'open', 'fqc', 'completed'
    const [selectedJob, setSelectedJob] = useState(null);
    const [isFqcMode, setIsFqcMode] = useState(false);
    const [showExecutionModal, setShowExecutionModal] = useState(false);

    const [counts, setCounts] = useState({ active: 0, completed: 0 });

    // Execution Step State
    const [qtyInputs, setQtyInputs] = useState({
        received: 0,
        processed: 0,
        rejected: 0,
        remarks: ''
    });

    // FQC State
    const [fqcValues, setFqcValues] = useState([]);
    const [fqcQty, setFqcQty] = useState({ received: 0, processed: 0, rejected: 0, stepId: null });
    const [zoomedImage, setZoomedImage] = useState(null); // For image zoom modal

    useEffect(() => {
        if (selectedEmployeeId) {
            console.log('EmployeeJobs: Refreshing data for Employee ID:', selectedEmployeeId);
            refreshData();
        } else {
            console.log('EmployeeJobs: No employee selected in context yet.');
        }
    }, [selectedEmployeeId, activeTab]);

    const refreshData = async () => {
        try {
            setLoading(true);

            // 1. Always fetch counts for all employee tabs
            const openData = await getOpenJobs();
            setOpenJobs(openData);

            const assignedData = await getJobCardsByEmployee(selectedEmployeeId);
            const activeItems = [];
            const completedItems = [];

            assignedData.forEach(job => {
                if (job.steps) {
                    job.steps.forEach(step => {
                        const isAssigned = step.assignedEmployees?.some(ae => {
                            if (!ae || !ae.employeeId) return false;
                            const empIdOfStep = ae.employeeId._id || ae.employeeId.id || ae.employeeId;
                            return String(empIdOfStep) === String(selectedEmployeeId);
                        });

                        if (isAssigned) {
                            const entry = { ...job, currentStep: step, type: 'internal' };
                            if (step.status === 'completed') {
                                completedItems.push(entry);
                            } else {
                                activeItems.push(entry);
                            }
                        }
                    });
                }
            });

            setCounts({ active: activeItems.length, completed: completedItems.length });

            // 2. Set display list based on active tab
            if (activeTab === 'assigned') {
                setJobs(activeItems);
            } else if (activeTab === 'completed') {
                setJobs(completedItems);
            } else if (activeTab === 'open') {
                // Handled via openJobs.map
            } else if (activeTab === 'fqc') {
                // Fetch FQC stage jobs (General Pool)
                const fqcStageData = await getJobCardsByStage('Verification');

                // Also include any 'testing' steps assigned to THIS user, even if job not in 'Verification' stage
                const myFqcAssignments = assignedData.filter(job =>
                    job.steps.some(s =>
                        (s.stepType === 'testing' || s.stepName?.toLowerCase().includes('qc')) &&
                        s.assignedEmployees?.some(ae => String(ae.employeeId?._id || ae.employeeId) === String(selectedEmployeeId)) &&
                        s.status !== 'completed'
                    )
                );

                // Union by ID to prevent duplicates
                const unionMap = new Map();
                fqcStageData.forEach(j => unionMap.set(j._id, j));
                myFqcAssignments.forEach(j => unionMap.set(j._id, j));

                setJobs(Array.from(unionMap.values()));
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFQC = (job, targetStep = null) => {
        console.log('[FQC] Opening job:', job.jobNumber);

        // Calculate received quantity dynamically from the manufacturing "flow"
        // Find the index of the current target step (or the first QC step if not provided)
        const steps = job.steps || [];
        const fqcIndex = targetStep
            ? steps.findIndex(s => s.stepId === targetStep.stepId)
            : steps.findIndex(s => s.stepType === 'testing' || s.stepName?.toLowerCase().includes('qc'));

        // Look at all steps before this one and find the last MANUFACTURING step
        const prevMfgSteps = steps.slice(0, fqcIndex > -1 ? fqcIndex : steps.length)
            .filter(s => s.stepType !== 'testing' && !s.stepName?.toLowerCase().includes('qc'));

        const lastMfgProcessed = prevMfgSteps.length > 0
            ? prevMfgSteps[prevMfgSteps.length - 1].quantities.processed
            : null;

        // Final Priority: 
        // 1. Last Mfg Step's Processed Qty (The actual flow)
        // 2. The step's own 'received' field (Backup)
        // 3. The original Job quantity (Absolute fallback)
        const received = lastMfgProcessed !== null
            ? lastMfgProcessed
            : (targetStep?.quantities?.received || job.quantity);

        console.log(`[FQC Flow] Target Step Index: ${fqcIndex}, Prev Mfg Processed: ${lastMfgProcessed}, Falling back to: ${received}`);
        setFqcQty({ received, processed: received, rejected: 0, stepId: targetStep?.stepId || targetStep?._id });

        // prefer job-level snapshot, fallback to item-level
        const fqcParams = (job.fqcParameters && job.fqcParameters.length > 0)
            ? job.fqcParameters
            : (job.itemId?.finalQualityCheck?.map(p => ({
                parameterName: p.parameter,
                notation: p.notation,
                positiveTolerance: p.positiveTolerance || '',
                negativeTolerance: p.negativeTolerance || '',
                actualValue: p.actualValue || '',
                standardValue: p.standardValue || '',
                valueType: p.valueType,
                samples: Array.from({ length: job.itemId.finalQualityCheckSampleSize || 1 }, (_, i) => ({ sampleNumber: i + 1, reading: '' }))
            })) || []);

        console.log('[FQC DEBUG] Job Item FQC Data:', job.itemId?.finalQualityCheck);
        console.log('[FQC DEBUG] Mapped FQC Params:', fqcParams);
        console.log('[FQC DEBUG] FQC Images:', job.itemId?.finalQualityCheckImages);

        const initialFQC = fqcParams.map(p => ({
            parameterId: p._id || p.id,
            parameterName: p.parameterName,
            notation: p.notation,
            positiveTolerance: p.positiveTolerance || '',
            negativeTolerance: p.negativeTolerance || '',
            actualValue: p.actualValue || '',
            standardValue: p.standardValue || '',
            samples: (p.samples && p.samples.length > 0)
                ? p.samples.map(s => s.reading || '')
                : Array(job.requiredSamples || job.itemId?.finalQualityCheckSampleSize || 1).fill(''),
            remarks: p.remarks || ''
        }));

        console.log('[FQC DEBUG] Initial FQC Values:', initialFQC);

        setFqcValues(initialFQC);
        setSelectedJob(job);
    };

    const handleFqcSampleChange = (paramIdx, sampleIdx, value) => {
        const newFqc = [...fqcValues];
        newFqc[paramIdx].samples[sampleIdx] = value;
        setFqcValues(newFqc);
    };

    const handleFqcRemarksChange = (paramIdx, value) => {
        const newFqc = [...fqcValues];
        newFqc[paramIdx].remarks = value;
        setFqcValues(newFqc);
    };

    const submitFQC = async () => {
        // Validation: Mandatory Remarks
        if (fqcValues.some(v => !v.remarks || v.remarks.trim() === '')) {
            alert('All remarks are mandatory for FQC');
            return;
        }

        // Validation: Mandatory Sample Readings
        const hasEmptySamples = fqcValues.some(v => v.samples.some(s => s === '' || s === undefined || s === null));
        if (hasEmptySamples) {
            alert('All sample readings are mandatory for FQC. Please fill all readings.');
            return;
        }

        // Validation: Quantity consistency
        if (Number(fqcQty.processed) + Number(fqcQty.rejected) > Number(fqcQty.received)) {
            alert(`Quantity Mismatch: Pass (${fqcQty.processed}) + Fail (${fqcQty.rejected}) exceeds Total Received (${fqcQty.received})`);
            return;
        }

        try {
            await submitFQCResults(selectedJob._id, {
                results: fqcValues,
                processed: fqcQty.processed,
                rejected: fqcQty.rejected,
                stepId: fqcQty.stepId
            }, selectedEmployeeId);
            alert('FQC results submitted');
            setIsFqcMode(false);
            refreshData();
            setSelectedJob(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit FQC');
        }
    };

    const handleAcceptJob = async (jobId, stepId) => {
        try {
            await acceptOpenJob(jobId, stepId, selectedEmployeeId);
            alert('Job accepted and moved to your assignments');
            setActiveTab('assigned');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to accept job');
        }
    };

    const handleStartStep = async (jobId, stepId) => {
        try {
            const effectiveEmployeeId = selectedEmployeeId || user?._id || user?.id;
            console.log(`Starting Step: Job=${jobId}, Step=${stepId}, Emp=${effectiveEmployeeId}`);

            if (!effectiveEmployeeId) {
                alert('Error: Could not determine employee identity. Please re-login.');
                return;
            }

            await executeProductionStep(jobId, stepId, { status: 'in-progress' }, effectiveEmployeeId);
            refreshData();
            if (selectedJob?._id === jobId) {
                const updated = await getJobCardById(jobId);
                const step = updated.steps.find(s => s.stepId === stepId); // Loose match handled in transform if needed, but here simple find
                setSelectedJob({ ...updated, currentStep: step });
            }
        } catch (error) {
            console.error(error);
            if (error.response?.data?.debug) {
                // Show raw debug info for better diagnostics
                alert(`DEBUG INFO:\n${JSON.stringify(error.response.data.debug, null, 2)}`);
            } else {
                alert(error.response?.data?.message || 'Failed to start step');
            }
        }
    };

    const handleSubStepToggle = async (subStepId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            const updatedJob = await toggleJobSubstep(selectedJob._id, selectedJob.currentStep?.stepId, subStepId, newStatus);

            // Update state to reflect change immediately
            const updatedStep = updatedJob.steps.find(s => s.stepId === selectedJob.currentStep?.stepId);
            setSelectedJob({ ...updatedJob, currentStep: updatedStep });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update sub-step status');
        }
    };

    const handleOpenExecution = (job, step) => {
        // Strict check: Only "Final Quality Check" goes to Sampling UI
        const isFinalQC = step.stepName?.toLowerCase() === 'final quality check' || step.isMandatoryFQC === true;

        if (isFinalQC) {
            handleOpenFQC(job, step);
            setIsFqcMode(true);
            return;
        }

        const stepIndex = job.steps.findIndex(s => s.stepId === step.stepId);
        if (stepIndex > 0) {
            const prevStep = job.steps[stepIndex - 1];
            if (prevStep.status !== 'completed') {
                alert('You cannot start this step until the previous step is completed.');
                return;
            }
            setQtyInputs({
                received: prevStep.quantities?.processed || job.quantity,
                processed: prevStep.quantities?.processed || job.quantity,
                rejected: 0,
                remarks: ''
            });
        } else {
            setQtyInputs({
                received: job.quantity,
                processed: job.quantity,
                rejected: 0,
                remarks: ''
            });
        }
        setShowExecutionModal(true);
    };

    const submitExecution = async () => {
        const { received, processed, rejected, remarks } = qtyInputs;
        if (!remarks || remarks.trim() === '') {
            alert('Remarks are mandatory');
            return;
        }
        if (Number(processed) + Number(rejected) > Number(received)) {
            alert('Processed + Rejected cannot exceed Received quantity');
            return;
        }

        // Validate Sub-steps
        if (selectedJob.currentStep?.subSteps && selectedJob.currentStep.subSteps.some(ss => ss.status !== 'completed')) {
            alert('Please complete all checklist items/sub-steps before completing the main step.');
            return;
        }

        try {
            const effectiveEmployeeId = selectedEmployeeId || user?._id || user?.id;
            if (!effectiveEmployeeId) {
                alert('Error: Could not determine employee identity.');
                return;
            }

            if (selectedJob.currentStep?.isOutward) {
                await completeOutwardWork(selectedJob._id, selectedJob.currentStep?.stepId, {
                    receivedQty: processed,
                    rejectedQty: rejected,
                    remarks,
                    returnDate: new Date()
                }, effectiveEmployeeId);
            } else {
                await executeProductionStep(selectedJob._id, selectedJob.currentStep?.stepId, {
                    status: 'completed',
                    ...qtyInputs
                }, effectiveEmployeeId);
            }
            setShowExecutionModal(false);
            refreshData();
            setSelectedJob(null);
        } catch (error) {
            console.error(error);
            if (error.response?.data?.debug) {
                // Show raw debug info for better diagnostics
                alert(`DEBUG INFO:\n${JSON.stringify(error.response.data.debug, null, 2)}`);
            } else {
                alert(error.response?.data?.message || 'Failed to complete step');
            }
        }
    };

    const renderJobSteps = (job) => {
        // Steps are already sorted by order in DB, which represents the sequence
        const renderStepCard = (step, idx) => {
            const isMyStep = step.assignedEmployees?.some(ae => String(ae.employeeId?._id || ae.employeeId) === String(selectedEmployeeId));
            const isQC = step.stepType === 'testing' || step.stepName?.toLowerCase().includes('qc');

            return (
                <div
                    key={step.stepId}
                    className={`p-3 rounded-md border flex items-center justify-between transition-all ${isMyStep
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100 shadow-sm'
                        : isQC
                            ? 'border-indigo-100 bg-indigo-50/50'
                            : 'border-slate-200 bg-white opacity-90'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm border ${step.status === 'completed'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : isQC
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            {step.status === 'completed' ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        <div>
                            <p className={`text-sm font-bold flex items-center gap-2 ${isMyStep ? 'text-blue-900' : 'text-slate-700'}`}>
                                {step.stepName}
                                {step.isOutward && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">Outsource</span>}
                                {isQC && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200 flex items-center gap-1"><ClipboardCheck size={10} /> QC</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                {isQC ? 'INSPECTION POINT' : 'PROCESS STEP'} | <span className={`capitalize ${step.status === 'pending' ? 'text-slate-400' : step.status === 'in-progress' ? 'text-amber-600' : 'text-emerald-600'}`}>{step.status}</span>
                            </p>
                            {step.status === 'completed' && (
                                <p className="text-[10px] font-bold text-blue-600 mt-1 flex items-center gap-2">
                                    <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">PASS: {step.quantities.processed}</span>
                                    <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-rose-600">FAIL: {step.quantities.rejected}</span>
                                </p>
                            )}
                            {step.description && (
                                <p className="text-[11px] text-slate-500 mt-1 italic border-l-2 border-slate-300 pl-2">
                                    {step.description}
                                </p>
                            )}
                            {/* Assignee info if not me */}
                            {!isMyStep && step.status !== 'completed' && (
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Users size={10} />
                                    {step.assignedEmployees?.length > 0
                                        ? step.assignedEmployees.map(e => e.employeeId?.name || 'Unknown').join(', ')
                                        : 'Unassigned'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isMyStep && step.status !== 'completed' && (
                        <div className="flex gap-2">
                            {/* Only allow START if it's the first step or previous is completed? 
                                Backend enforces it, but nice to visually disable if obvious? 
                                For now, rely on backend validation + error message. */}
                            {step.status === 'pending' ? (
                                <button
                                    onClick={() => handleStartStep(job._id, step.stepId)}
                                    className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded shadow hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    START
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleOpenExecution(job, step)}
                                    className={`px-4 py-1.5 text-white text-[11px] font-bold rounded shadow active:scale-95 transition-all ${isQC ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {isQC ? 'INSPECT' : 'COMPLETE'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* If unassigned and pending, show 'Accept' if Open Job logic applies? 
                        Currently Open Jobs are in a different tab. 
                        But if I'm viewing 'Assigned', I just see dependencies. */}
                </div>
            );
        };

        return (
            <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <List size={14} /> Full Execution Timeline
                </h3>
                <div className="space-y-3 relative">
                    {/* Vertical Line Connector */}
                    <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>

                    {job.steps.map((step, idx) => renderStepCard(step, idx))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 pb-2">
                <button
                    onClick={() => { setLoading(true); setActiveTab('assigned'); setSelectedJob(null); }}
                    className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'assigned' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Briefcase size={16} /> ASSIGNED JOBS ({counts.active})
                </button>
                <button
                    onClick={() => { setLoading(true); setActiveTab('completed'); setSelectedJob(null); }}
                    className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <CheckCircle2 size={16} /> COMPLETED JOBS ({counts.completed})
                </button>
                <button
                    onClick={() => { setLoading(true); setActiveTab('open'); setSelectedJob(null); }}
                    className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'open' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Users size={16} /> OPEN JOBS ({openJobs.length})
                </button>
                <button
                    onClick={() => { setLoading(true); setActiveTab('fqc'); setSelectedJob(null); }}
                    className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'fqc' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <ClipboardCheck size={16} /> FQC PASS
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* List View */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg overflow-y-auto p-4 space-y-3">
                    {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading jobs...</div>}

                    {!loading && (activeTab === 'assigned' || activeTab === 'completed') && jobs.map(job => (
                        <div
                            key={`${job._id}-${job.currentStep?.stepId || 'unknown'}`}
                            onClick={() => setSelectedJob(job)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${selectedJob?._id === job._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${job.currentStep?.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {job.currentStep?.status ? job.currentStep.status.toUpperCase() : 'UNKNOWN'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">{job.jobNumber}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">{job.itemId?.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{job.orderId?.partyName}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                                <ChevronRight size={14} className="text-blue-500" />
                                <span>{job.currentStep?.stepName || 'Unknown Step'}</span>
                            </div>
                        </div>
                    ))}

                    {!loading && activeTab === 'open' && openJobs.map(job => (
                        <div
                            key={`${job.jobCardId}-${job.stepId}`}
                            className="p-4 border border-slate-200 rounded-lg bg-white"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">OPEN JOB</span>
                                <span className="text-[10px] font-mono text-slate-400">{job.jobNumber}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">{job.itemName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{job.partyName}</p>
                            <div className="mt-3 p-2 bg-slate-50 border border-dashed border-slate-300 rounded flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">{job.stepName}</span>
                                <button
                                    onClick={() => handleAcceptJob(job.jobCardId, job.stepId)}
                                    className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700"
                                >
                                    ACCEPT
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && activeTab === 'fqc' && jobs.map((job, idx) => (
                        <div
                            key={`${job._id}-${idx}`}
                            onClick={() => setSelectedJob(job)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${selectedJob?._id === job._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">WAITING FQC</span>
                                <span className="text-[10px] font-mono text-slate-400">{job.jobNumber}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">{job.itemId?.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{job.orderId?.partyName}</p>
                            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>QTY: {job.quantity}</span>
                                <span>STAGE: {job.stage}</span>
                            </div>
                        </div>
                    ))}

                    {!loading && (activeTab === 'assigned' || activeTab === 'open' || activeTab === 'fqc' || activeTab === 'completed') &&
                        ((activeTab === 'assigned' && jobs.length === 0) ||
                            (activeTab === 'open' && openJobs.length === 0) ||
                            (activeTab === 'completed' && jobs.length === 0) ||
                            (activeTab === 'fqc' && jobs.length === 0)) && (
                            <div className="text-center py-20 text-slate-400 text-sm italic">
                                No {activeTab} jobs found.
                            </div>
                        )}
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                    {selectedJob ? (
                        <>
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedJob.itemId?.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedJob.orderId?.partyName} | PO: {selectedJob.orderId?.poNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-mono text-slate-400">JOB NO: {selectedJob.jobNumber}</span>
                                        <span className="block text-lg font-black text-slate-900">{selectedJob.quantity} UNIT</span>
                                        {selectedJob.extraQty > 0 && (
                                            <span className="block text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded inline-block mt-0.5" title="Extra / Buffer Production">
                                                +{selectedJob.extraQty} EXTRA
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Production Progress</span>
                                        <span>{Math.round((selectedJob.steps.filter(s => s.status === 'completed').length / selectedJob.steps.length) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                            style={{ width: `${(selectedJob.steps.filter(s => s.status === 'completed').length / selectedJob.steps.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {selectedJob.rmRequirements?.length > 0 && (
                                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Package size={16} /> Raw Material Consumption Requirements
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedJob.rmRequirements.map((rm, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded border border-amber-100 flex justify-between items-center shadow-sm">
                                                    <span className="text-sm font-bold text-slate-700">{rm.name}</span>
                                                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                        {rm.required.toFixed(2)} {rm.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-[10px] text-amber-600 italic font-medium">* Materials will be automatically subtracted from inventory upon starting the job.</p>
                                    </div>
                                )}

                                {(activeTab === 'fqc' || isFqcMode) ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isFqcMode && (
                                                    <button
                                                        onClick={() => setIsFqcMode(false)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <ArrowLeftRight size={20} />
                                                    </button>
                                                )}
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                    <ClipboardCheck size={20} className="text-blue-600" /> Final Quality Check Sampling
                                                </h3>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    SAMPLES REQUIRED: {selectedJob.requiredSamples || selectedJob.itemId?.finalQualityCheckSampleSize || 1}
                                                </div>
                                                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 border border-blue-100">
                                                    TOTAL ITEMS TO INSPECT: {fqcQty.received}
                                                </div>
                                            </div>
                                        </div>

                                        {/* QC REFERENCE IMAGES */}
                                        {selectedJob.itemId?.finalQualityCheckImages?.length > 0 && (
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reference Images / Documents</p>
                                                <div className="flex gap-4 overflow-x-auto pb-2">
                                                    {selectedJob.itemId.finalQualityCheckImages.map((img, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => setZoomedImage(img)}
                                                            className="flex-shrink-0 cursor-pointer group"
                                                        >
                                                            <img
                                                                src={img}
                                                                alt={`QC Ref ${i + 1}`}
                                                                className="h-24 w-32 object-cover rounded border-2 border-slate-300 group-hover:border-blue-500 group-hover:shadow-lg transition-all shadow-sm bg-white"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                            <p className="text-[9px] text-center mt-1 text-slate-500 group-hover:text-blue-600 font-medium">Click to zoom</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-widest">
                                                        <th className="p-3 border-r border-slate-700">Parameter</th>
                                                        <th className="p-3 border-r border-slate-700 text-center">Notation</th>
                                                        <th className="p-3 border-r border-slate-700 text-center">+Tol</th>
                                                        <th className="p-3 border-r border-slate-700 text-center">-Tol</th>
                                                        <th className="p-3 border-r border-slate-700 text-center">Expected</th>
                                                        {fqcValues[0]?.samples.map((_, i) => (
                                                            <th key={i} className="p-3 border-r border-slate-700 text-center min-w-[80px]">Sample {i + 1}</th>
                                                        ))}
                                                        <th className="p-3">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fqcValues.map((v, pIdx) => (
                                                        <tr key={pIdx} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="p-3 border-t border-r border-slate-200 font-black text-slate-800 bg-slate-50/50">
                                                                {v.parameterName}
                                                            </td>
                                                            <td className="p-3 border-t border-r border-slate-200 text-center font-mono text-blue-600 font-bold">
                                                                {v.notation || '-'}
                                                            </td>
                                                            <td className="p-3 border-t border-r border-slate-200 text-center text-emerald-600 font-bold">
                                                                {v.positiveTolerance || '-'}
                                                            </td>
                                                            <td className="p-3 border-t border-r border-slate-200 text-center text-rose-600 font-bold">
                                                                {v.negativeTolerance || '-'}
                                                            </td>
                                                            <td className="p-3 border-t border-r border-slate-200 text-center text-purple-600 font-bold">
                                                                {v.actualValue || v.standardValue || '-'}
                                                            </td>
                                                            {v.samples.map((s, sIdx) => (
                                                                <td key={sIdx} className="p-2 border-t border-r border-slate-200 bg-white">
                                                                    <input
                                                                        type="text"
                                                                        value={s}
                                                                        onChange={(e) => handleFqcSampleChange(pIdx, sIdx, e.target.value)}
                                                                        className="w-full p-2 bg-blue-50/50 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none font-black text-center text-blue-900"
                                                                        placeholder="..."
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="p-2 border-t border-slate-200">
                                                                <input
                                                                    type="text"
                                                                    value={v.remarks}
                                                                    placeholder="Results..."
                                                                    onChange={(e) => handleFqcRemarksChange(pIdx, e.target.value)}
                                                                    className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-[11px]"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* FQC QUANTITY INPUTS */}
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-emerald-600">Approved (Pass) Quantity</label>
                                                <input
                                                    type="number"
                                                    value={fqcQty.processed}
                                                    onChange={(e) => setFqcQty({ ...fqcQty, processed: Number(e.target.value) })}
                                                    className="w-full p-2 border-2 border-emerald-500 bg-emerald-50 rounded text-sm font-bold text-emerald-900 focus:ring-4 focus:ring-emerald-100 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-rose-600">Rejected (Fail) Quantity</label>
                                                <input
                                                    type="number"
                                                    value={fqcQty.rejected}
                                                    onChange={(e) => setFqcQty({ ...fqcQty, rejected: Number(e.target.value) })}
                                                    className="w-full p-2 border-2 border-rose-500 bg-rose-50 rounded text-sm font-bold text-rose-900 focus:ring-4 focus:ring-rose-100 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    if (isFqcMode) setIsFqcMode(false);
                                                    else setSelectedJob(null);
                                                }}
                                                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-200 transition-all"
                                            >
                                                {isFqcMode ? 'BACK TO STEPS' : 'CLOSE'}
                                            </button>
                                            <button
                                                onClick={submitFQC}
                                                className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={18} /> APPROVE & SUBMIT FINAL QUALITY CHECK
                                            </button>
                                        </div>
                                    </div>
                                ) : renderJobSteps(selectedJob)}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-300">
                            <ShoppingBag size={64} className="mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-sm">Select a job for execution details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Execution Modal */}
            <AnimatePresence>
                {showExecutionModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <ArrowLeftRight size={18} className="text-emerald-500" /> Complete Process Step
                                </h3>
                                <button onClick={() => setShowExecutionModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] font-bold text-blue-700 uppercase tracking-widest">
                                    {selectedJob?.currentStep?.stepName || 'Process Step'}
                                </div>

                                {/* Sub-steps Checklist */}
                                {selectedJob?.currentStep?.subSteps?.length > 0 && (
                                    <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                        <div className="p-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList size={12} /> Checklist / Sub-tasks
                                        </div>
                                        <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                                            {selectedJob.currentStep?.subSteps?.map(ss => (
                                                <div
                                                    key={ss.id}
                                                    className="p-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                                    onClick={() => handleSubStepToggle(ss.id, ss.status)}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${ss.status === 'completed' ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                                                        }`}>
                                                        {ss.status === 'completed' && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <span className={`text-xs font-medium ${ss.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                        {ss.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{selectedJob?.currentStep?.isOutward ? 'To Vendor' : 'Received'}</label>
                                        <input
                                            type="number"
                                            value={qtyInputs.received}
                                            readOnly
                                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-sm font-bold text-slate-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-emerald-600">{selectedJob?.currentStep?.isOutward ? 'From Vendor' : 'Processed'}</label>
                                        <input
                                            type="number"
                                            value={qtyInputs.processed}
                                            onChange={(e) => setQtyInputs({ ...qtyInputs, processed: Number(e.target.value) })}
                                            className="w-full p-2 border-2 border-emerald-500 bg-emerald-50 rounded text-sm font-bold text-emerald-900 focus:ring-4 focus:ring-emerald-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-rose-600">Rejected</label>
                                        <input
                                            type="number"
                                            value={qtyInputs.rejected}
                                            onChange={(e) => setQtyInputs({ ...qtyInputs, rejected: Number(e.target.value) })}
                                            className="w-full p-2 border-2 border-rose-500 bg-rose-50 rounded text-sm font-bold text-rose-900 focus:ring-4 focus:ring-rose-100 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Mandatory)</label>
                                    <textarea
                                        rows="3"
                                        value={qtyInputs.remarks}
                                        onChange={(e) => setQtyInputs({ ...qtyInputs, remarks: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter process details or issues..."
                                    />
                                </div>
                                <button
                                    onClick={submitExecution}
                                    className="w-full py-3 bg-slate-900 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-lg shadow-slate-200"
                                >
                                    SUBMIT QUANTITY & COMPLETE STEP
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Image Zoom Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <div
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative max-w-6xl max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setZoomedImage(null)}
                                className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
                            >
                                <XCircle size={32} />
                            </button>
                            <img
                                src={zoomedImage}
                                alt="Zoomed FQC Reference"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                            <p className="text-white text-center mt-4 text-sm">Click outside to close</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default EmployeeJobs;
