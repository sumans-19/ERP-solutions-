import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getParties, getFollowUps, createFollowUp } from '../../services/partyApi';
import { getEmployees } from '../../services/employeeApi';
import { Search, History, User, Calendar, Save, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PartyFollowUpsPage = () => {
    const [parties, setParties] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedParty, setSelectedParty] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [followUps, setFollowUps] = useState([]);
    const [employeeAssignments, setEmployeeAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [meetingDate, setMeetingDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [flag, setFlag] = useState('neutral');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchParties(), fetchEmployees()]);
        };
        init();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        if (selectedParty) {
            fetchFollowUps(selectedParty._id);
            setMeetingDate('');
            setRemarks('');
            setFlag('neutral');
            // If party selected, clear employee specific work view
            setEmployeeAssignments([]);
        }
    }, [selectedParty]);

    useEffect(() => {
        if (selectedEmployee && !selectedParty) {
            fetchEmployeeAssignments(selectedEmployee._id);
        }
    }, [selectedEmployee, selectedParty]);

    const fetchEmployeeAssignments = async (employeeId) => {
        try {
            const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/api/employees/${employeeId}/assignments`, { headers });
            setEmployeeAssignments(res.data);
        } catch (error) {
            console.error("Failed to fetch employee assignments", error);
        }
    };

    const fetchParties = async () => {
        try {
            const data = await getParties();
            setParties(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch parties", error);
            setLoading(false);
        }
    };

    const fetchFollowUps = async (partyId) => {
        try {
            const data = await getFollowUps(partyId);
            setFollowUps(data);
        } catch (error) {
            console.error("Failed to fetch follow ups", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedParty || !selectedEmployee || !meetingDate || !remarks) {
            alert('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await createFollowUp({
                partyId: selectedParty._id,
                partyName: selectedParty.name,
                meetingDateTime: meetingDate,
                remarks: remarks,
                flag: flag,
                createdBy: selectedEmployee._id,
                createdByName: selectedEmployee.fullName,
                createdByRole: selectedEmployee.role
            });
            await fetchFollowUps(selectedParty._id);
            setRemarks('');
            setMeetingDate('');
            alert('Follow-up recorded!');
        } catch (error) {
            console.error("Failed to save follow up", error);
            alert('Failed to save.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History size={24} className="text-blue-600" />
                    Follow Ups & Work Tracking
                </h2>
                <p className="text-sm text-slate-500 mt-1">Track customer meetings and employee task assignments</p>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                {/* Left: New Follow Up */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                        <h3 className="font-semibold text-slate-800">New Follow Up</h3>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Select Party */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Party *</label>
                                    <select
                                        value={selectedParty?._id || ''}
                                        onChange={(e) => {
                                            const party = parties.find(p => p._id === e.target.value);
                                            setSelectedParty(party);
                                        }}
                                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    >
                                        <option value="">-- Choose a Party --</option>
                                        {parties.map(party => (
                                            <option key={party._id} value={party._id}>
                                                {party.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Select Employee */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee *</label>
                                    <select
                                        value={selectedEmployee?._id || ''}
                                        onChange={(e) => {
                                            const empValue = e.target.value;
                                            const emp = employees.find(item => item._id === empValue);
                                            setSelectedEmployee(emp);
                                            // If selecting an employee and no party yet, this helps trigger work history
                                            if (emp && !selectedParty) {
                                                fetchEmployeeAssignments(emp._id);
                                            }
                                        }}
                                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                    >
                                        <option value="">-- Choose Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Meeting Date & Time */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={meetingDate}
                                    onChange={e => setMeetingDate(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                                <textarea
                                    rows="4"
                                    required
                                    placeholder="Enter meeting notes..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            {/* Sentiment Flag */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Sentiment Flag</label>
                                <select
                                    value={flag}
                                    onChange={e => setFlag(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="neutral">Neutral</option>
                                    <option value="positive">Positive</option>
                                    <option value="negative">Negative</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedParty}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {submitting ? 'Saving...' : 'Save Follow Up'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: History/Tracking Content */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            {selectedParty ? (
                                <>
                                    <History size={18} className="text-purple-600" />
                                    Party Follow Up History
                                </>
                            ) : selectedEmployee ? (
                                <>
                                    <Calendar size={18} className="text-blue-600" />
                                    Employee Work History
                                </>
                            ) : (
                                <>
                                    <Search size={18} className="text-slate-400" />
                                    Tracking History
                                </>
                            )}
                        </h3>
                        {selectedParty && followUps.length > 0 && (
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                                {followUps.length}
                            </span>
                        )}
                        {!selectedParty && selectedEmployee && employeeAssignments.length > 0 && (
                            <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full text-blue-600">
                                {employeeAssignments.length} Tasks
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
                        {!selectedParty && !selectedEmployee ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <User size={48} className="text-slate-200 mb-2" />
                                <p className="text-sm text-center">Select a party or employee<br />to view history</p>
                            </div>
                        ) : (
                            <>
                                {selectedParty && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <History size={14} className="text-purple-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Party History - {selectedParty.name}</span>
                                        </div>
                                        {followUps.length === 0 ? (
                                            <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
                                                No history recorded yet for this party.
                                            </div>
                                        ) : (
                                            followUps.map(fu => (
                                                <div key={fu._id} className="relative pl-4 border-l-2 border-slate-200 pb-1 last:border-0 last:pb-0">
                                                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${fu.flag === 'positive' ? 'bg-green-500' :
                                                        fu.flag === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                                                        }`} />

                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                                {new Date(fu.meetingDateTime).toLocaleDateString()}
                                                                <span className="text-xs font-normal text-slate-400">
                                                                    {new Date(fu.meetingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize border ${fu.flag === 'positive' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                fu.flag === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                                }`}>
                                                                {fu.flag}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-600 mb-2 whitespace-pre-wrap text-xs">{fu.remarks}</p>
                                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <span>By {fu.createdByName}</span>
                                                            <span>•</span>
                                                            <span>{new Date(fu.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {selectedEmployee && (
                                    <div className="space-y-3 pt-4 border-t border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Work Tracking - {selectedEmployee.fullName}</span>
                                        </div>
                                        {employeeAssignments.length === 0 ? (
                                            <div className="text-center py-4 bg-white/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs italic">
                                                No active assignments for this employee.
                                            </div>
                                        ) : (
                                            employeeAssignments.map((as, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-xs">{as.itemName}</h4>
                                                            <div className="text-[9px] text-slate-500 font-mono">{as.itemCode || 'No Code'}</div>
                                                        </div>
                                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${as.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            as.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {as.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        <div>
                                                            <div className="text-slate-400 uppercase font-black text-[8px] mb-0.5">Step</div>
                                                            <div className="text-slate-700 font-medium truncate">{as.stepName}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-slate-400 uppercase font-black text-[8px] mb-0.5">Assigned</div>
                                                            <div className="text-slate-600">{new Date(as.assignedAt).toLocaleDateString()}</div>
                                                        </div>
                                                        {as.expectedCompletionDate && (
                                                            <div className="col-span-2 pt-1 mt-1 border-t border-slate-50 flex justify-between">
                                                                <span className="text-blue-600 font-bold uppercase text-[8px]">Expect By</span>
                                                                <span className="text-blue-700 font-bold">{new Date(as.expectedCompletionDate).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartyFollowUpsPage;
