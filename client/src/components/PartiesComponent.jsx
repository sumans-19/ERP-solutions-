import React, { useState, useEffect } from 'react';
import { getParties, getFollowUps, createFollowUp, createParty } from '../services/partyApi';
import { Search, MapPin, Phone, Calendar, Clock, PlusCircle, History, User, Plus } from 'lucide-react';
import AddPartyModal from './AddPartyModal';

const PartiesComponent = () => {
    // --- State ---
    const [parties, setParties] = useState([]);
    const [selectedParty, setSelectedParty] = useState(null);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);

    // Form State
    const [meetingDate, setMeetingDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [flag, setFlag] = useState('neutral');
    const [submitting, setSubmitting] = useState(false);

    // --- Effects ---
    useEffect(() => {
        fetchParties();
    }, []);

    useEffect(() => {
        if (selectedParty) {
            fetchFollowUps(selectedParty._id);
            // Reset form
            setMeetingDate('');
            setRemarks('');
            setFlag('neutral');
        }
    }, [selectedParty]);

    // --- Actions ---
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

    const handleSaveParty = async (partyData) => {
        try {
            // Map frontend form data to backend schema
            const payload = {
                ...partyData,
                currentBalance: Number(partyData.openingBalance) || 0,
                customCreditLimit: partyData.customCreditLimit ? Number(partyData.customCreditLimit) : undefined,
                initialOrder: {
                    orderNumber: partyData.initialOrderNo,
                    totalItems: Number(partyData.initialOrderQty) || 0,
                    ratePerItem: Number(partyData.initialOrderRate) || 0,
                    description: partyData.initialOrderDesc
                },
                location: `${partyData.city}${partyData.city && partyData.state ? ', ' : ''}${partyData.state}` // Construct display location
            };

            // Debug log
            console.log("Saving Party Payload:", payload);

            await createParty(payload);
            await fetchParties(); // Refresh list
            alert('Party added successfully!');
            setIsAddPartyModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Failed to create party", error);
            alert('Failed to add party.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedParty || !meetingDate || !remarks) return;

        setSubmitting(true);
        try {
            await createFollowUp({
                partyId: selectedParty._id,
                partyName: selectedParty.name,
                meetingDateTime: meetingDate,
                remarks: remarks,
                flag: flag,
                // In real app, get from Context
                createdByName: 'Dev User',
                createdByRole: 'Admin'
            });
            // Refresh history
            await fetchFollowUps(selectedParty._id);
            setRemarks(''); // Clear remarks
            setMeetingDate('');
            alert('Follow-up recorded!');
        } catch (error) {
            console.error("Failed to save follow up", error);
            alert('Failed to save.');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Filtering ---
    const filteredParties = parties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Parties...</div>;

    return (
        <div className="flex gap-4 min-h-[500px] h-full overflow-hidden relative">
            <AddPartyModal
                isOpen={isAddPartyModalOpen}
                onClose={() => setIsAddPartyModalOpen(false)}
                onSave={handleSaveParty}
            />

            {/* 🟦 COLUMN 1: Parties List */}
            <div className="w-1/4 min-w-[250px] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <User size={18} className="text-blue-600" /> Parties
                        </h2>
                        <button
                            onClick={() => setIsAddPartyModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-sm transition-transform hover:scale-105"
                            title="Add New Party"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="mt-3 relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[400px]">
                    {filteredParties.length === 0 ? (
                        <div className="text-center p-4 text-slate-400 text-sm">No parties found</div>
                    ) : (
                        filteredParties.map(party => (
                            <div
                                key={party._id}
                                onClick={() => setSelectedParty(party)}
                                className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedParty?._id === party._id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                                    }`}
                            >
                                <div className="font-medium text-slate-800">{party.name}</div>
                                {party.phone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone size={10} /> {party.phone}</div>}
                                {party.location && <div className="text-xs text-slate-400 mt-0.5">{party.location}</div>}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 🟦 COLUMN 2: Details & New Follow Up */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <PlusCircle size={18} className="text-emerald-600" /> Record Follow Up
                    </h2>
                </div>

                {selectedParty ? (
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Party Details Card */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    {selectedParty.name}
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${selectedParty.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {selectedParty.status}
                                    </span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    {selectedParty.phone && <div className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {selectedParty.phone}</div>}
                                    {selectedParty.gstin && <div className="text-sm text-slate-600 flex items-center gap-2"><span className="text-xs font-bold text-slate-400">GST</span> {selectedParty.gstin}</div>}
                                </div>
                            </div>

                            {/* Address Section */}
                            {(selectedParty.billingAddress || selectedParty.city) && (
                                <div className="pt-3 border-t border-slate-200">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Address</h4>
                                    <div className="text-sm text-slate-600 flex items-start gap-2">
                                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p>{selectedParty.billingAddress}</p>
                                            <p>{selectedParty.city}{selectedParty.state ? `, ${selectedParty.state}` : ''} {selectedParty.pincode ? `- ${selectedParty.pincode}` : ''}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financials Section */}
                            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Balance</h4>
                                    <p className={`text-sm font-bold ${selectedParty.paymentType === 'toPay' ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{selectedParty.currentBalance?.toLocaleString() || 0}
                                        <span className="text-xs font-normal text-slate-500 ml-1">({selectedParty.paymentType === 'toPay' ? 'To Pay' : 'To Receive'})</span>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Credit Limit</h4>
                                    <p className="text-sm text-slate-700">
                                        {selectedParty.creditLimitType === 'noLimit' ? 'No Limit' : `₹${selectedParty.customCreditLimit?.toLocaleString()}`}
                                    </p>
                                </div>
                            </div>

                            {/* Additional Fields Section */}
                            {selectedParty.additionalFields && selectedParty.additionalFields.length > 0 && (
                                <div className="pt-3 border-t border-slate-200">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Additional Details</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedParty.additionalFields.map((field, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs">
                                                <span className="font-semibold text-slate-500">{field.key}:</span> <span className="text-slate-700">{field.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={meetingDate}
                                    onChange={e => setMeetingDate(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                                <textarea
                                    rows="3"
                                    required
                                    placeholder="Enter meeting outcomes..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sentiment Flag</label>
                                <div className="flex gap-4">
                                    {['neutral', 'positive', 'negative'].map(f => (
                                        <label key={f} className={`
                                            flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                                            ${flag === f
                                                ? f === 'positive' ? 'bg-green-50 border-green-200 text-green-700' :
                                                    f === 'negative' ? 'bg-red-50 border-red-200 text-red-700' :
                                                        'bg-slate-100 border-slate-300 text-slate-700'
                                                : 'border-slate-200 hover:bg-slate-50'
                                            }
                                        `}>
                                            <input
                                                type="radio"
                                                name="flag"
                                                value={f}
                                                checked={flag === f}
                                                onChange={() => setFlag(f)}
                                                className="hidden"
                                            />
                                            <span className="capitalize text-sm font-medium">{f}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition shadow-sm disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Follow Up'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <User size={48} className="text-slate-200 mb-2" />
                        <p>Select a party to record detail</p>
                    </div>
                )}
            </div>

            {/* 🟦 COLUMN 3: History */}
            <div className="w-1/3 min-w-[300px] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-purple-600" /> History
                    </h2>
                    {followUps.length > 0 && <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{followUps.length}</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 max-h-[400px]">
                    {selectedParty ? (
                        followUps.length === 0 ? (
                            <div className="text-center pt-10 text-slate-400 text-sm italic">No history recorded yet.</div>
                        ) : (
                            followUps.map(fu => (
                                <div key={fu._id} className="relative pl-4 border-l-2 border-slate-200 pb-1 last:border-0 last:pb-0">
                                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${fu.flag === 'positive' ? 'bg-green-500' :
                                        fu.flag === 'negative' ? 'bg-red-500' : 'bg-slate-400'
                                        }`}></div>

                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                {new Date(fu.meetingDateTime).toLocaleDateString()}
                                                <span className="text-xs font-normal text-slate-400">{new Date(fu.meetingDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize border ${fu.flag === 'positive' ? 'bg-green-50 text-green-700 border-green-100' :
                                                fu.flag === 'negative' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>{fu.flag}</span>
                                        </div>
                                        <p className="text-slate-600 mb-2 whitespace-pre-wrap">{fu.remarks}</p>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <span>By {fu.createdByName}</span>
                                            <span>•</span>
                                            <span>{new Date(fu.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="text-center pt-10 text-slate-400 opacity-50">Select a party to view history</div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default PartiesComponent;
