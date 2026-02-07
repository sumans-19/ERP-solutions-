import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getParties, getFollowUps, createFollowUp } from '../../services/partyApi';
import { History, User, Calendar, Save, Search, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.10:5001';

const FollowUpsPage = () => {
    const [parties, setParties] = useState([]);
    const [selectedParty, setSelectedParty] = useState(null);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [meetingDate, setMeetingDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [flag, setFlag] = useState('neutral');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchParties();
    }, []);

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

    useEffect(() => {
        if (selectedParty) {
            fetchFollowUps(selectedParty._id);
            setMeetingDate('');
            setRemarks('');
            setFlag('neutral');
        } else {
            setFollowUps([]);
        }
    }, [selectedParty]);

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
        if (!selectedParty || !meetingDate || !remarks) {
            alert('Please fill all required fields');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert('User not authenticated');
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
                createdBy: user._id, // Auto-assign current user
                createdByName: user.fullName || user.username || 'Unknown',
                createdByRole: user.role
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
        <div className="h-full w-full flex flex-col p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <History size={24} className="text-blue-600" />
                    Follow Ups
                </h2>
                <p className="text-sm text-slate-500 mt-1">Track customer meetings and interactions</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left: New Follow Up */}
                <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                        <h3 className="font-semibold text-slate-800">New Follow Up</h3>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Select Party */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Party *</label>
                                <select
                                    value={selectedParty?._id || ''}
                                    onChange={(e) => {
                                        const party = parties.find(p => p._id === e.target.value);
                                        setSelectedParty(party);
                                    }}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">-- Choose a Party --</option>
                                    {parties.map(party => (
                                        <option key={party._id} value={party._id}>
                                            {party.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Meeting Date & Time */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={meetingDate}
                                    onChange={e => setMeetingDate(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks *</label>
                                <textarea
                                    rows="6"
                                    required
                                    placeholder="Enter meeting notes..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            {/* Sentiment Flag */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Sentiment Flag</label>
                                <select
                                    value={flag}
                                    onChange={e => setFlag(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="neutral">Neutral</option>
                                    <option value="positive">Positive</option>
                                    <option value="negative">Negative</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedParty}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {submitting ? 'Saving...' : 'Save Follow Up'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: History/Tracking Content */}
                <div className="bg-white border border-slate-200 rounded-md shadow-sm flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            {selectedParty ? (
                                <>
                                    <History size={18} className="text-purple-600" />
                                    History: {selectedParty.name}
                                </>
                            ) : (
                                <>
                                    <Search size={18} className="text-slate-400" />
                                    Follow Up History
                                </>
                            )}
                        </h3>
                        {selectedParty && followUps.length > 0 && (
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                                {followUps.length} Records
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
                        {!selectedParty ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                                <User size={48} className="text-slate-200 mb-4" />
                                <p className="text-sm text-center font-medium">Select a party to view their follow-up history.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {followUps.length === 0 ? (
                                    <div className="text-center py-12 bg-white/50 rounded-md border border-dashed border-slate-200 text-slate-400">
                                        <p className="text-sm">No follow-ups recorded yet for this party.</p>
                                    </div>
                                ) : (
                                    followUps.map(fu => (
                                        <div key={fu._id} className="relative pl-6 border-l-2 border-slate-200 pb-2 last:border-0 last:pb-0">
                                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-1 ring-white ${fu.flag === 'positive' ? 'bg-green-500' :
                                                fu.flag === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                                                }`} />

                                            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                        {new Date(fu.meetingDateTime).toLocaleDateString()}
                                                        <span className="text-xs font-normal text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded">
                                                            {new Date(fu.meetingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${fu.flag === 'positive' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        fu.flag === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {fu.flag}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 mb-3 whitespace-pre-wrap text-sm leading-relaxed">{fu.remarks}</p>
                                                <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {fu.createdByName}
                                                    </span>
                                                    <span>Created: {new Date(fu.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FollowUpsPage;

