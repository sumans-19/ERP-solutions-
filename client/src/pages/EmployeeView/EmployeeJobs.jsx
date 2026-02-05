import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getJobCardsByEmployee,
    getOpenJobs,
    acceptOpenJob,
    executeProductionStep,
    submitFQCResults,
    getJobCardById,
    toggleJobSubstep,
    getJobCardsByStage,
    completeOutwardWork,
    getAllJobs
} from '../../services/api';
import {
    Briefcase, CheckCircle, Circle, Clock, ChevronRight, FileText,
    AlertTriangle, Layout, List, ClipboardList, CheckCircle2, AlertCircle, Calendar, Users,
    ArrowRight, Play, Trash2, ClipboardCheck,
    Search, Filter, Package, ShoppingBag, ArrowLeftRight, XCircle, Camera, Upload, Globe, ArrowLeft
} from 'lucide-react';
import ZoomableImageViewer from '../../components/ZoomableImageViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';
import { useNotification } from '../../contexts/NotificationContext';

const validateSample = (value, standard, posTol, negTol, valType) => {
    if (!value) return null; // No validation if empty
    if (valType === 'boolean') return value.toLowerCase() === 'pass';
    if (valType === 'alphanumeric' || valType === 'alphabet') return true;

    // Numeric check
    const numVal = parseFloat(value);
    const std = parseFloat(standard);
    const pos = parseFloat(posTol) || 0;
    const neg = parseFloat(negTol) || 0;

    if (isNaN(numVal) || isNaN(std)) return null;

    const min = std - neg;
    const max = std + pos;

    return numVal >= min && numVal <= max;
};

const EmployeeJobs = ({ user, viewMode = 'my-jobs' }) => {
    const { showNotification } = useNotification();
    const { selectedEmployeeId } = useEmployeeView();
    const [jobs, setJobs] = useState([]);
    const [openJobs, setOpenJobs] = useState([]);
    const [globalJobs, setGlobalJobs] = useState([]); // For Global Search
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const loadingRef = useRef(false); // Track loading without triggering re-renders

    // Initialize tab based on mode
    const [activeTab, setActiveTab] = useState(viewMode === 'global' ? 'open' : 'assigned');

    // Sync tab when mode changes
    useEffect(() => {
        if (viewMode === 'global') {
            if (activeTab !== 'open' && activeTab !== 'search') setActiveTab('open');
        } else {
            if (activeTab === 'open' || activeTab === 'search') setActiveTab('assigned');
        }
    }, [viewMode]);

    const [selectedJob, setSelectedJob] = useState(null);
    const [isFqcMode, setIsFqcMode] = useState(false);
    const [showExecutionModal, setShowExecutionModal] = useState(false);

    const [counts, setCounts] = useState({ active: 0, completed: 0, open: 0, global: 0 });

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
    const [fqcImages, setFqcImages] = useState([]); // State for FQC execution images
    const [zoomedImage, setZoomedImage] = useState(null); // For image zoom modal

    useEffect(() => {
        if (selectedEmployeeId) {
            console.log('EmployeeJobs: Refreshing data for Employee ID:', selectedEmployeeId);
            refreshData();
        } else {
            console.log('EmployeeJobs: No employee selected in context yet.');
        }
    }, [selectedEmployeeId, activeTab]);

    const refreshData = useCallback(async () => {
        // Aggressive throttle to prevent re-render loops
        const now = Date.now();
        if (window.lastJobRefresh && now - window.lastJobRefresh < 5000) {
            console.log('[refreshData] THROTTLED - skipping refresh (last refresh was', Math.round((now - window.lastJobRefresh) / 1000), 'seconds ago)');
            return;
        }
        window.lastJobRefresh = now;

        // Prevent concurrent refreshes
        if (loadingRef.current) {
            console.log('[refreshData] BLOCKED - already loading');
            return;
        }

        try {
            console.log('[refreshData] STARTING refresh for employee:', selectedEmployeeId);
            loadingRef.current = true;
            setLoading(true);

            // Fetch data in parallel to avoid blocking
            const [openResult, assignedResult] = await Promise.allSettled([
                getOpenJobs(),
                getJobCardsByEmployee(selectedEmployeeId)
            ]);

            const openData = openResult.status === 'fulfilled' ? openResult.value : [];
            const assignedData = assignedResult.status === 'fulfilled' ? assignedResult.value : [];

            if (openResult.status === 'rejected') {
                console.error('[EmployeeJobs] Failed to fetch open jobs:', openResult.reason);
                console.error('[EmployeeJobs] Error details:', openResult.reason?.response?.data);
                console.error('[EmployeeJobs] Status code:', openResult.reason?.response?.status);
            }
            if (assignedResult.status === 'rejected') {
                console.error('[EmployeeJobs] Failed to fetch assigned jobs:', assignedResult.reason);
                console.error('[EmployeeJobs] Error details:', assignedResult.reason?.response?.data);
                console.error('[EmployeeJobs] Status code:', assignedResult.reason?.response?.status);
            }

            console.log('[EmployeeJobs] Open jobs count:', openData.length);
            console.log('[EmployeeJobs] Assigned jobs count:', assignedData.length);

            setOpenJobs(openData);

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

            // Update Counts
            setCounts({ active: activeItems.length, completed: completedItems.length, open: openData.length, global: 0 });

            // 2. Mode Specific Display Logic
            if (viewMode === 'global') {
                if (activeTab === 'search') {
                    // Global Search - Fetch on demand or if not too heavy
                    // For now, let's lazy load or keep existing logic but separate it
                    getAllJobs().then(allData => {
                        setGlobalJobs(allData);
                        setCounts(prev => ({ ...prev, global: allData.length }));

                        if (searchQuery) {
                            const lowerQ = searchQuery.toLowerCase();
                            const filtered = allData.filter(j =>
                                j.jobNumber?.toLowerCase().includes(lowerQ) ||
                                j.itemId?.name?.toLowerCase().includes(lowerQ) ||
                                j.orderId?.poNumber?.toLowerCase().includes(lowerQ) ||
                                j.orderId?.partyName?.toLowerCase().includes(lowerQ)
                            );
                            setJobs(filtered);
                        } else {
                            setJobs(allData);
                        }
                    }).catch(err => console.error('Error fetching global jobs:', err));

                } else if (activeTab === 'open') {
                    // Open jobs already fetched and set in openJobs state
                    // We don't set 'jobs' state for 'open' tab because it uses 'openJobs' state directly in render
                }
            } else {
                // My Jobs Logic
                if (activeTab === 'assigned') {
                    setJobs(activeItems);
                } else if (activeTab === 'completed') {
                    setJobs(completedItems);
                } else if (activeTab === 'fqc') {
                    // Fetch FQC jobs specifically if tab is active
                    // This avoids blocking other tabs for FQC query
                    try {
                        const fqcStageData = await getJobCardsByStage('Verification');
                        const myFqcAssignments = assignedData.filter(job =>
                            job.steps.some(s =>
                                (s.stepType === 'testing' || s.stepName?.toLowerCase().includes('qc')) &&
                                s.assignedEmployees?.some(ae => String(ae.employeeId?._id || ae.employeeId) === String(selectedEmployeeId)) &&
                                s.status !== 'completed'
                            )
                        );

                        // Merge logic
                        const unionMap = new Map();
                        fqcStageData.forEach(j => unionMap.set(j._id, j));
                        myFqcAssignments.forEach(j => unionMap.set(j._id, j));
                        setJobs(Array.from(unionMap.values()));
                    } catch (fqcErr) {
                        console.error('Error fetching FQC jobs:', fqcErr);
                        setJobs([]);
                    }
                }
            }
        } catch (error) {
            console.error('CRITICAL Error refreshing data:', error);
            showNotification('Failed to refresh jobs. Please try again.', 'error');
        } finally {
            console.log('[refreshData] COMPLETED refresh');
            loadingRef.current = false;
            setLoading(false);
        }
    }, [selectedEmployeeId, viewMode, activeTab, searchQuery]);

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
        setFqcImages([]); // Reset images
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
            showNotification('All remarks are mandatory for FQC', 'warning');
            return;
        }

        // Validation: Mandatory Sample Readings
        const hasEmptySamples = fqcValues.some(v => v.samples.some(s => s === '' || s === undefined || s === null));
        if (hasEmptySamples) {
            showNotification('All sample readings are mandatory for FQC. Please fill all readings.', 'warning');
            return;
        }

        // Auto-Evaluation Logic
        let overallPass = true;
        const evaluatedResults = fqcValues.map(v => {
            const isParamPass = v.samples.every(s => {
                const valid = validateSample(s, v.standardValue || v.actualValue, v.positiveTolerance, v.negativeTolerance, v.valueType);
                return valid === true;
            });

            if (!isParamPass) overallPass = false;

            return {
                ...v,
                status: isParamPass ? 'Passed' : 'Failed'
            };
        });

        // Validation: Quantity consistency
        if (Number(fqcQty.processed) + Number(fqcQty.rejected) > Number(fqcQty.received)) {
            showNotification(`Quantity Mismatch: Pass (${fqcQty.processed}) + Fail (${fqcQty.rejected}) exceeds Total Received (${fqcQty.received})`, 'error');
            return;
        }

        // Message & Confirmation
        const message = overallPass
            ? (selectedJob.fqcPositiveMessage || "✅ FQC Passed! All parameters are within range. Approve Job?")
            : (selectedJob.fqcNegativeMessage || "❌ FQC Failed! Some parameters are out of range. Reject Job?");

        if (!window.confirm(message)) {
            return;
        }

        try {
            await submitFQCResults(selectedJob._id, {
                results: evaluatedResults,
                fqcStatus: overallPass ? 'Passed' : 'Failed', // Send Overall Status
                processed: fqcQty.processed,
                rejected: fqcQty.rejected,
                stepId: fqcQty.stepId,
                images: fqcImages // Include uploaded images
            }, selectedEmployeeId);
            showNotification('FQC results submitted successfully');
            setIsFqcMode(false);
            refreshData();
            setSelectedJob(null);
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to submit FQC', 'error');
        }
    };

    const handleAcceptJob = async (jobId, stepId) => {
        console.log('[handleAcceptJob] CALLED with:', { jobId, stepId, selectedEmployeeId });
        try {
            console.log('[handleAcceptJob] Calling acceptOpenJob API...');
            const result = await acceptOpenJob(jobId, stepId, selectedEmployeeId);
            console.log('[handleAcceptJob] API SUCCESS:', result);
            showNotification('Job accepted and moved to your assignments');
            await refreshData(); // Refresh data to update job lists
            setActiveTab('assigned');
        } catch (error) {
            console.error('[handleAcceptJob] API FAILED:', error);
            console.error('[handleAcceptJob] Error response:', error.response?.data);
            console.error('[handleAcceptJob] Status code:', error.response?.status);
            showNotification(error.response?.data?.message || 'Failed to accept job', 'error');
        }
    };

    const handleStartStep = async (jobId, stepId) => {
        try {
            const effectiveEmployeeId = selectedEmployeeId || user?._id || user?.id;
            console.log(`Starting Step: Job=${jobId}, Step=${stepId}, Emp=${effectiveEmployeeId}`);

            if (!effectiveEmployeeId) {
                showNotification('Error: Could not determine employee identity. Please re-login.', 'error');
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
                const debugInfo = error.response.data.debug;
                if (debugInfo.prevStep) {
                    showNotification(`Blocking: Step "${debugInfo.prevStep}" must be completed first.`, 'info');
                } else {
                    showNotification(`DEBUG INFO:\n${JSON.stringify(debugInfo, null, 2)}`, 'info');
                }
            } else {
                showNotification(error.response?.data?.message || 'Failed to start step', 'error');
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
            showNotification(error.response?.data?.message || 'Failed to update sub-step status', 'error');
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
                showNotification('You cannot start this step until the previous step is completed.', 'info');
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

        if (Number(processed) + Number(rejected) > Number(received)) {
            showNotification('Processed + Rejected cannot exceed Received quantity', 'warning');
            return;
        }

        // Validate Sub-steps
        if (selectedJob.currentStep?.subSteps && selectedJob.currentStep.subSteps.some(ss => ss.status !== 'completed')) {
            showNotification('Please complete all checklist items/sub-steps before completing the main step.', 'warning');
            return;
        }

        try {
            const effectiveEmployeeId = selectedEmployeeId || user?._id || user?.id;
            if (!effectiveEmployeeId) {
                showNotification('Error: Could not determine employee identity.', 'error');
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
                const debugInfo = error.response.data.debug;
                if (debugInfo.prevStep) {
                    showNotification(`Blocking: Step "${debugInfo.prevStep}" must be completed first.`, 'info');
                } else {
                    showNotification(`DEBUG INFO:\n${JSON.stringify(debugInfo, null, 2)}`, 'info');
                }
            } else {
                showNotification(error.response?.data?.message || 'Failed to complete step', 'error');
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
                    className={`p-4 rounded-lg border flex items-start justify-between transition-all ${isMyStep
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-md'
                        : isQC
                            ? 'border-indigo-200 bg-indigo-50/50'
                            : 'border-slate-200 bg-white opacity-90'
                        }`}
                >
                    <div className="flex items-start gap-4 flex-1">
                        {/* Step Number Badge */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-md border-2 ${step.status === 'completed'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : isQC
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                            {step.status === 'completed' ? <CheckCircle size={18} /> : idx + 1}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className={`text-base font-bold ${isMyStep ? 'text-blue-900' : 'text-slate-800'}`}>
                                    {step.stepName}
                                </p>
                                {step.isOpenJob && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-300 font-bold">OPEN JOB</span>
                                )}
                                {step.isOutward && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300 font-bold">OUTSOURCE</span>}
                                {isQC && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-300 flex items-center gap-1 font-bold"><ClipboardCheck size={10} /> QC</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                                Step #{idx + 1} • {isQC ? 'INSPECTION POINT' : 'PROCESS STEP'} • <span className={`capitalize ${step.status === 'pending' ? 'text-slate-400' : step.status === 'in-progress' ? 'text-amber-600' : 'text-emerald-600'}`}>{step.status}</span>
                            </p>

                            {/* Assigned Employees Display */}
                            {step.assignedEmployees?.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                    {step.assignedEmployees.map((ae, aeIdx) => {
                                        const emp = ae.employeeId;
                                        const empId = emp?._id || emp?.id || emp;
                                        const empName = emp?.fullName || emp?.name || 'Unknown';
                                        const empCode = emp?.employeeId || '';
                                        const isMe = String(empId) === String(selectedEmployeeId);
                                        return (
                                            <div key={aeIdx} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${isMe
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                <Users size={10} />
                                                <span>{empName}</span>
                                                {empCode && <span className="text-[9px] opacity-70">({empCode})</span>}
                                                {isMe && <span className="ml-1 text-[9px] bg-blue-200 px-1 rounded">YOU</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {step.isOpenJob && step.assignedEmployees?.length === 0 && (
                                <div className="mb-2">
                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Available for any employee to accept</span>
                                </div>
                            )}

                            {step.status === 'completed' && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 text-[11px] font-bold text-emerald-700">PASS: {step.quantities.processed}</span>
                                    <span className="bg-rose-50 px-2 py-1 rounded-md border border-rose-200 text-[11px] font-bold text-rose-600">REJECTED: {step.quantities.rejected}</span>
                                </div>
                            )}
                            {step.description && (
                                <p className="text-[11px] text-slate-500 mt-2 italic border-l-2 border-slate-300 pl-2">
                                    {step.description}
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
            {/* Header Tabs with Mobile-First Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-100 flex-shrink-0">
                {viewMode === 'my-jobs' ? (
                    <>
                        <button
                            onClick={() => { setLoading(true); setActiveTab('assigned'); setSelectedJob(null); }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'assigned'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            <Briefcase size={14} /> Assigned <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{counts.active}</span>
                        </button>
                        <button
                            onClick={() => { setLoading(true); setActiveTab('fqc'); setSelectedJob(null); }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'fqc'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            <ClipboardCheck size={14} /> FQC Check
                        </button>
                        <button
                            onClick={() => { setLoading(true); setActiveTab('completed'); setSelectedJob(null); }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'completed'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            <CheckCircle2 size={14} /> Done <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{counts.completed}</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => { setLoading(true); setActiveTab('open'); setSelectedJob(null); }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'open'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                                : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            <Package size={14} /> Open Pool <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{counts.open}</span>
                        </button>
                        <button
                            onClick={() => { setLoading(true); setActiveTab('search'); setSelectedJob(null); }}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'search'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                        >
                            <Globe size={14} /> Global Search <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{counts.global}</span>
                        </button>
                    </>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* List View - Hidden on Mobile when Job Selected */}
                <div className={`lg:col-span-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col ${selectedJob ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Search Header */}
                    {activeTab === 'search' && (
                        <div className="p-3 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search all jobs..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setSearchQuery(newVal);

                                        // Robust local filter logic
                                        if (viewMode === 'global' && globalJobs.length > 0) {
                                            const lowerQ = newVal.toLowerCase() || '';
                                            console.log(`[Search] Filtering ${globalJobs.length} jobs with "${lowerQ}"`);

                                            const filtered = globalJobs.filter(j =>
                                                (j.jobNumber && j.jobNumber.toLowerCase().includes(lowerQ)) ||
                                                (j.itemId?.name && j.itemId.name.toLowerCase().includes(lowerQ)) ||
                                                (j.orderId?.poNumber && j.orderId.poNumber.toLowerCase().includes(lowerQ)) ||
                                                (j.orderId?.partyName && j.orderId.partyName.toLowerCase().includes(lowerQ))
                                            );
                                            console.log(`[Search] Found ${filtered.length} matches`);
                                            setJobs(filtered);
                                        }
                                    }}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading jobs...</div>}

                        {!loading && (activeTab === 'assigned' || activeTab === 'completed' || activeTab === 'search') && jobs.map(job => (
                            <div
                                key={`${job._id}-${job.currentStep?.stepId || 'unknown'}`}
                                onClick={() => setSelectedJob(job)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${selectedJob?._id === job._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${job.currentStep?.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {job.currentStep?.status ? job.currentStep.status.toUpperCase() : (job.stage || 'UNKNOWN')}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{job.itemId?.name || job.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1">{job.orderId?.partyName}</p>
                                <p className="text-base font-black text-blue-600 mb-2">{job.jobNumber}</p>
                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <ChevronRight size={14} className="text-blue-500" />
                                    <span>{job.currentStep?.stepName || 'View Details'}</span>
                                </div>
                            </div>
                        ))}

                        {!loading && activeTab === 'open' && openJobs.map((job, idx) => (
                            <div
                                key={`${job.jobCardId}-${job.stepId}`}
                                className="p-4 border-2 border-green-200 rounded-lg bg-green-50/30 hover:bg-green-50 transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 shadow-sm">OPEN JOB</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{job.itemName}</h4>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-1">{job.partyName}</p>
                                <p className="text-base font-black text-blue-600 mb-3">{job.jobNumber}</p>

                                {/* Step Details Box */}
                                <div className="bg-white rounded-lg p-3 mb-3 border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                            {job.stepNumber || idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step</p>
                                            <p className="text-xs font-bold text-slate-800">{job.stepName}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quantity</p>
                                        <p className="text-sm font-bold text-slate-700">{job.quantity} units</p>
                                    </div>

                                    {/* Show assigned employees if any */}
                                    {job.assignedEmployees && job.assignedEmployees.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Already Assigned</p>
                                            <div className="flex flex-wrap gap-1">
                                                {job.assignedEmployees.map((emp, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">
                                                        {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleAcceptJob(job.jobCardId, job.stepId)}
                                    className="w-full py-2.5 bg-green-600 text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-green-700 shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={14} /> ACCEPT THIS JOB
                                </button>
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

                        {!loading && (activeTab === 'assigned' || activeTab === 'open' || activeTab === 'fqc' || activeTab === 'completed' || activeTab === 'search') &&
                            ((activeTab === 'assigned' && jobs.length === 0) ||
                                (activeTab === 'open' && openJobs.length === 0) ||
                                (activeTab === 'completed' && jobs.length === 0) ||
                                (activeTab === 'search' && jobs.length === 0) ||
                                (activeTab === 'fqc' && jobs.length === 0)) && (
                                <div className="text-center py-20 text-slate-400 text-sm italic">
                                    No {activeTab} jobs found.
                                </div>
                            )}
                    </div>
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                    {selectedJob ? (
                        <>
                            <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="lg:hidden mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm"
                                >
                                    <ArrowLeft size={14} /> Back to List
                                </button>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedJob.itemId?.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedJob.orderId?.partyName} | PO: {selectedJob.orderId?.poNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-black text-blue-600 mb-1">{selectedJob.jobNumber}</span>
                                        <div className="bg-white border-2 border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                                            {selectedJob.extraQty > 0 ? (
                                                <div className="text-center">
                                                    <div className="text-lg font-black text-slate-900">
                                                        {selectedJob.quantity + selectedJob.extraQty} units
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-medium">
                                                        {selectedJob.quantity} + <span className="text-amber-600 font-bold">{selectedJob.extraQty} extras</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-lg font-black text-slate-900">{selectedJob.quantity} units</div>
                                            )}
                                        </div>
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

                                {/* ITEM MEDIA SECTION (Images & PDFs) */}
                                {(selectedJob.itemId?.images?.length > 0 || selectedJob.itemId?.image) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Package size={14} /> Product Design & Drawings
                                        </p>
                                        <div className="flex flex-wrap gap-4">
                                            {/* Legacy Single Image */}
                                            {selectedJob.itemId?.image && !selectedJob.itemId.image.startsWith('data:application/pdf') && (
                                                <div
                                                    className="relative w-24 h-24 group cursor-pointer"
                                                    onClick={() => setZoomedImage(selectedJob.itemId.image)}
                                                >
                                                    <img
                                                        src={selectedJob.itemId.image}
                                                        alt="Product Main"
                                                        className="w-full h-full object-cover rounded border border-slate-200 shadow-sm group-hover:border-blue-400 transition-all"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                                        <Search size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Gallery Images */}
                                            {selectedJob.itemId?.images?.filter(img => !img.startsWith('data:application/pdf')).map((img, idx) => (
                                                <div
                                                    key={`prod-img-${idx}`}
                                                    className="relative w-24 h-24 group cursor-pointer"
                                                    onClick={() => setZoomedImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Product View ${idx + 1}`}
                                                        className="w-full h-full object-cover rounded border border-slate-200 shadow-sm group-hover:border-blue-400 transition-all"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                                        <Search size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                    </div>
                                                </div>
                                            ))}

                                            {/* PDF Documents */}
                                            {selectedJob.itemId?.images?.filter(img => img.startsWith('data:application/pdf')).map((pdf, idx) => (
                                                <div key={`pdf-${idx}`} className="w-48 h-24 bg-red-50 border border-red-100 rounded flex flex-col items-center justify-center p-2 text-center hover:border-red-300 transition-colors group">
                                                    <FileText size={24} className="text-red-500 mb-1" />
                                                    <span className="text-[10px] font-bold text-slate-600 truncate w-full">Document {idx + 1}</span>
                                                    <a
                                                        href={pdf}
                                                        download={`spec-sheet-${idx + 1}.pdf`}
                                                        className="mt-1 text-[9px] bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded shadow-sm hover:bg-red-600 hover:text-white transition-all uppercase font-bold"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Download PDF
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

                                        {/* Overall QC Remark - High Visibility */}
                                        {selectedJob.fqcOverallRemark && (
                                            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r shadow-sm">
                                                <h5 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <AlertTriangle size={12} /> Special QC Instructions
                                                </h5>
                                                <p className="text-sm font-bold text-slate-800">{selectedJob.fqcOverallRemark}</p>
                                            </div>
                                        )}

                                        {/* QC REFERENCE IMAGES */}
                                        {selectedJob.itemId?.finalQualityCheckImages?.length > 0 && (
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
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
                                                        <th className="p-3 border-r border-slate-700 text-center bg-indigo-900 text-indigo-100">Range</th>
                                                        {fqcValues[0]?.samples.map((_, i) => (
                                                            <th key={i} className="p-3 border-r border-slate-700 text-center min-w-[80px]">Sample {i + 1}</th>
                                                        ))}
                                                        <th className="p-3">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fqcValues.map((v, pIdx) => {
                                                        const std = parseFloat(v.standardValue || v.actualValue);
                                                        const pos = parseFloat(v.positiveTolerance) || 0;
                                                        const neg = parseFloat(v.negativeTolerance) || 0;
                                                        const min = !isNaN(std) ? (std - neg).toFixed(2) : '-';
                                                        const max = !isNaN(std) ? (std + pos).toFixed(2) : '-';

                                                        return (
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
                                                                <td className="p-3 border-t border-r border-slate-200 text-center font-mono font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                                                                    {!isNaN(std) ? `${min} - ${max}` : '-'}
                                                                </td>
                                                                {v.samples.map((s, sIdx) => {
                                                                    const isValid = validateSample(s, v.standardValue || v.actualValue, v.positiveTolerance, v.negativeTolerance, v.valueType);
                                                                    let bgClass = "bg-blue-50/50 border-blue-200 text-blue-900";
                                                                    if (s && isValid === true) bgClass = "bg-emerald-100 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200";
                                                                    if (s && isValid === false) bgClass = "bg-rose-100 border-rose-400 text-rose-900 ring-2 ring-rose-200";

                                                                    return (
                                                                        <td key={sIdx} className="p-2 border-t border-r border-slate-200 bg-white">
                                                                            <input
                                                                                type="text"
                                                                                value={s}
                                                                                onChange={(e) => handleFqcSampleChange(pIdx, sIdx, e.target.value)}
                                                                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-black text-center ${bgClass}`}
                                                                                placeholder="..."
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
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
                                                        )
                                                    })}
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

                                        {/* FQC ACTUAL IMAGES UPLOAD SECTION */}
                                        <div className="mt-6 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Camera size={14} /> Capture Inspection Images / Upload Proofs
                                            </h4>

                                            <div className="flex flex-wrap gap-3">
                                                {/* Upload Button */}
                                                <label className="w-20 h-20 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm">
                                                    <Upload size={20} className="text-blue-500 mb-1" />
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Upload</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const files = Array.from(e.target.files);
                                                            files.forEach(file => {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setFqcImages(prev => [...prev, reader.result]);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            });
                                                            e.target.value = ''; // Reset
                                                        }}
                                                    />
                                                </label>

                                                {/* Image Previews */}
                                                {fqcImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-20 h-20 group">
                                                        <img
                                                            src={img}
                                                            alt={`Preview ${idx}`}
                                                            className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm"
                                                            onClick={() => setZoomedImage(img)}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFqcImages(prev => prev.filter((_, i) => i !== idx));
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-100 hover:bg-red-200 shadow-sm"
                                                        >
                                                            <XCircle size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
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
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] font-bold text-blue-700 uppercase tracking-widest flex justify-between items-center">
                                    <span>{selectedJob?.currentStep?.stepName || 'Process Step'}</span>
                                    <span className="text-[9px] bg-blue-200 px-2 py-0.5 rounded text-blue-800">STEP #{selectedJob?.steps?.findIndex(s => s.stepId === selectedJob.currentStep?.stepId) + 1}</span>
                                </div>

                                {/* EMBEDDED MEDIA SECTION FOR REFERENCE */}
                                {(selectedJob?.itemId?.images?.length > 0 || selectedJob?.itemId?.image) && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Design & Docs</span>
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                                            {/* Legacy Single Image */}
                                            {selectedJob.itemId?.image && !selectedJob.itemId.image.startsWith('data:application/pdf') && (
                                                <img
                                                    src={selectedJob.itemId.image}
                                                    alt="Main Ref"
                                                    className="h-16 w-16 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in hover:border-blue-500 transition-colors flex-shrink-0"
                                                    onClick={() => setZoomedImage(selectedJob.itemId.image)}
                                                />
                                            )}

                                            {/* Gallery Images */}
                                            {selectedJob.itemId?.images?.filter(img => !img.startsWith('data:application/pdf')).map((img, idx) => (
                                                <img
                                                    key={`ref-img-${idx}`}
                                                    src={img}
                                                    alt={`Ref ${idx + 1}`}
                                                    className="h-16 w-16 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in hover:border-blue-500 transition-colors flex-shrink-0"
                                                    onClick={() => setZoomedImage(img)}
                                                />
                                            ))}

                                            {/* PDF Docs */}
                                            {selectedJob.itemId?.images?.filter(img => img.startsWith('data:application/pdf')).map((pdf, idx) => (
                                                <a
                                                    key={`ref-pdf-${idx}`}
                                                    href={pdf}
                                                    download={`doc-${idx + 1}.pdf`}
                                                    className="h-16 w-24 bg-red-50 border border-red-100 rounded flex flex-col items-center justify-center p-1 text-center hover:bg-red-100 transition-colors flex-shrink-0 group"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FileText size={16} className="text-red-500 mb-0.5" />
                                                    <span className="text-[8px] font-bold text-red-600 truncate w-full">Document {idx + 1}</span>
                                                    <span className="text-[7px] bg-red-600 text-white px-1 rounded font-bold uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-rose-600">Rejected</label>
                                        <input
                                            type="number"
                                            value={qtyInputs.rejected}
                                            onChange={(e) => {
                                                const rejected = Number(e.target.value) || 0;
                                                const received = Number(qtyInputs.received) || 0;
                                                const pass = Math.max(0, received - rejected);
                                                setQtyInputs({ ...qtyInputs, rejected, processed: pass });
                                            }}
                                            className="w-full p-2 border-2 border-rose-500 bg-rose-50 rounded text-sm font-bold text-rose-900 focus:ring-4 focus:ring-rose-100 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-emerald-600">{selectedJob?.currentStep?.isOutward ? 'From Vendor' : 'Pass'}</label>
                                        <input
                                            type="number"
                                            value={qtyInputs.processed}
                                            readOnly
                                            className="w-full p-2 bg-emerald-50 border-2 border-emerald-300 rounded text-sm font-bold text-emerald-700 outline-none cursor-not-allowed"
                                            title="Auto-calculated: Received - Rejected"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Optional)</label>
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

            {/* Zoomable Image Viewer Component */}
            {zoomedImage && (
                <ZoomableImageViewer
                    src={zoomedImage}
                    alt="Zoomed Preview"
                    onClose={() => setZoomedImage(null)}
                />
            )}
        </div >
    );
};

export default EmployeeJobs;
