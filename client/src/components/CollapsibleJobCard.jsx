import React from 'react';
import { ChevronDown, ChevronUp, Search, Package, Building2, Hash, UserPlus, CheckCircle, Clock, XCircle } from 'lucide-react';

const CollapsibleJobCard = ({ job, isExpanded, onToggle, employees, onAssignEmployee, onAddAssignee, onRemoveAssignee, onStepStatusUpdate }) => {
    const completedSteps = job.steps?.filter(s => s.status === 'completed').length || 0;
    const totalSteps = job.steps?.length || 0;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in-progress': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'pending': return 'bg-slate-50 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={14} className="text-emerald-600" />;
            case 'in-progress': return <Clock size={14} className="text-amber-600" />;
            case 'pending': return <Clock size={14} className="text-slate-400" />;
            default: return <Clock size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
            {/* Collapsed Header - Compact Design */}
            <div
                onClick={onToggle}
                className="p-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    {/* Compact Status Indicator & Job Num */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-slate-100 pr-4">
                        <span className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-black tracking-wider shadow-sm uppercase w-full text-center">
                            {job.jobNumber}
                        </span>
                        <div className="mt-2 flex items-center gap-1">
                            {getStatusIcon(job.status)}
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{job.status === 'in-progress' ? 'Active' : job.status}</span>
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-800 truncate pr-2" title={job.itemId?.name}>{job.itemId?.name}</h4>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Batch</span>
                                    <span className="text-sm font-black text-slate-900">{job.quantity} <span className="text-[10px] text-slate-400">{job.itemId?.unit}</span></span>
                                </div>
                                <div className="text-right min-w-[100px]">
                                    <div className="flex justify-end items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-black text-blue-600">{progressPercent}%</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Done</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Building2 size={10} />
                                <span className="text-[10px] font-bold truncate max-w-[150px]">{job.orderId?.partyName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Hash size={10} />
                                <span className="text-[10px] font-bold">PO: {job.orderId?.poNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="pl-2 text-slate-300 group-hover:text-slate-500 transition-colors">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/30">
                    {/* Job Details Banner (Reduced) */}
                    <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Code</p>
                            <p className="text-xs font-black text-slate-700">{job.itemId?.code || 'NO SKU'}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Steps Completed</p>
                                <p className="text-xs font-black text-slate-700">{completedSteps} / {totalSteps}</p>
                            </div>
                        </div>
                    </div>

                    {/* Media Gallery (Images & PDFs) */}
                    {(job.itemId?.images?.length > 0 || job.itemId?.image) && (
                        <div className="px-5 py-3 border-b border-slate-100 bg-white">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Package size={12} /> Product Design & Drawings
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {/* Legacy Single Image */}
                                {job.itemId?.image && !job.itemId.image.startsWith('data:application/pdf') && (
                                    <img
                                        src={job.itemId.image}
                                        alt="Product"
                                        className="w-16 h-16 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform"
                                    />
                                )}

                                {/* Gallery Images */}
                                {job.itemId?.images?.filter(img => !img.startsWith('data:application/pdf')).map((img, idx) => (
                                    <img
                                        key={`img-${idx}`}
                                        src={img}
                                        alt={`View ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in hover:scale-105 transition-transform"
                                    />
                                ))}

                                {/* PDF Downloads */}
                                {job.itemId?.images?.filter(img => img.startsWith('data:application/pdf')).map((pdf, idx) => (
                                    <a
                                        key={`pdf-${idx}`}
                                        href={pdf}
                                        download={`doc-${idx + 1}.pdf`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-32 h-16 bg-red-50 border border-red-100 rounded flex flex-col items-center justify-center p-1 text-center hover:bg-red-100 transition-colors"
                                    >
                                        <span className="text-[10px] font-bold text-red-600 truncate w-full">Document {idx + 1}</span>
                                        <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded mt-1 font-bold uppercase">Download</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Vertical Steps Layout - COMPACT & SCROLLABLE */}
                    <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/50">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Manufacturing Steps</h5>
                        <div className="space-y-2">
                            {job.steps?.map((step, index) => {
                                // Check if this is the FINAL step (last step = Final Quality Check)
                                const isFQC = index === job.steps.length - 1;

                                return (
                                    <div
                                        key={step._id || index}
                                        className={`rounded-lg p-3 shadow-sm border transition-all ${isFQC
                                            ? 'bg-gradient-to-r from-purple-50 to-white border-purple-200'
                                            : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        {/* Compact Step Header */}
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shadow-sm shrink-0 mt-0.5 ${isFQC
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-800 text-white'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-xs font-bold text-slate-800 whitespace-normal leading-tight">{step.stepName}</p>
                                                        {isFQC && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black rounded uppercase shrink-0">FQC</span>}
                                                    </div>
                                                    <div className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-black border uppercase whitespace-nowrap ${getStatusColor(step.status)}`}>
                                                        {step.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assignment & Actions Row */}
                                        <div className="flex items-center gap-2 pl-9">
                                            {/* Assignment Area */}
                                            <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[28px]">
                                                {step.assignedEmployees?.map((ae, i) => {
                                                    const emp = employees.find(e => e._id === (ae.employeeId?._id || ae.employeeId));
                                                    return (
                                                        <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 text-[10px] font-bold">
                                                            {emp?.fullName || emp?.name || 'Unknown'}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onRemoveAssignee(job._id, step._id, ae.employeeId?._id || ae.employeeId); }}
                                                                className="hover:text-red-600"
                                                            >
                                                                <XCircle size={10} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}

                                                {/* Searchable Assign Input */}
                                                <div className="relative flex-1 min-w-[120px]">
                                                    <input
                                                        list={`emp-list-${step._id}`}
                                                        placeholder="+ Assign via Search..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 outline-none"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const selectedEmp = employees.find(emp => (emp.fullName || emp.name) === val || emp.employeeId === val);
                                                            if (selectedEmp) {
                                                                onAddAssignee(job._id, step._id, selectedEmp._id);
                                                                e.target.value = ''; // Reset
                                                            }
                                                        }}
                                                    />
                                                    <datalist id={`emp-list-${step._id}`}>
                                                        {employees.map(emp => (
                                                            <option key={emp._id} value={emp.fullName || emp.name}>{emp.employeeId}</option>
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>

                                            {/* Compact Action Buttons */}
                                            <div className="flex gap-1">
                                                {step.status === 'pending' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStepStatusUpdate(job._id, step._id, 'in-progress'); }}
                                                        className="px-3 py-1 bg-white border border-amber-200 text-amber-600 rounded text-[10px] font-bold hover:bg-amber-50 uppercase shadow-sm"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {step.status === 'in-progress' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStepStatusUpdate(job._id, step._id, 'completed'); }}
                                                        className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 uppercase shadow-sm shadow-emerald-200"
                                                    >
                                                        Finish
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollapsibleJobCard;
