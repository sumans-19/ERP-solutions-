import React, { useState, useEffect } from 'react';
import { getParties, createParty, updateParty } from '../../services/partyApi';
import AddPartyModal from '../../components/AddPartyModal';
import EditPartyModal from '../../components/EditPartyModal';
import { Search, User, PlusCircle, MapPin, Phone, Edit2 } from 'lucide-react';

const PartiesPage = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleAddParty = async (formData) => {
        setIsSubmitting(true);
        try {
            await createParty(formData);
            await fetchParties();
            setIsAddModalOpen(false);
            alert('Party added successfully!');
        } catch (error) {
            console.error("Failed to add party", error);
            alert(error.response?.data?.message || "Failed to add party");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditParty = (party) => {
        setSelectedParty(party);
        setIsEditModalOpen(true);
    };

    const handleUpdateParty = async (partyId, formData) => {
        setIsSubmitting(true);
        try {
            await updateParty(partyId, formData);
            await fetchParties();
            setIsEditModalOpen(false);
            alert('Party updated successfully!');
        } catch (error) {
            console.error("Failed to update party", error);
            alert(error.response?.data?.message || "Failed to update party");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredParties = parties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Parties...</div>;

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User size={24} className="text-blue-600" />
                        Parties
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage customer and vendor information</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide rounded-md transition shadow-sm flex items-center gap-2 border border-blue-600"
                >
                    <PlusCircle size={16} />
                    Add Party
                </button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search parties..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                />
            </div>

            {/* Parties Grid - Professional Refactor */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredParties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-100">
                            <User size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-sm">No parties found matching your search</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredParties.map(party => (
                            <div
                                key={party._id}
                                className="group bg-white border border-slate-200 rounded-md p-3 hover:border-blue-400 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row items-center gap-4"
                            >
                                {/* 1. Company Identity */}
                                <div className="flex-1 w-full md:w-auto">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                                            {party.name}
                                        </h3>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${party.status === 'Active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                        >
                                            {party.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                            {party.customerCode || 'NO CODE'}
                                        </span>
                                        {party.gstin && (
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <span className="text-[10px] font-bold uppercase">GST:</span>
                                                <span className="text-slate-600 font-mono">{party.gstin}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Contact Details */}
                                <div className="w-full md:w-auto md:min-w-[220px] flex flex-col gap-1 text-xs border-l border-slate-100 pl-4 md:pl-4 md:border-l-0 lg:border-l">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone size={12} className="text-slate-400" />
                                        <span className="font-medium">{party.phone || 'No Phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={12} className="text-slate-400" />
                                        <span className="truncate max-w-[200px]">
                                            {party.billingCity || 'No City'}{party.billingState ? `, ${party.billingState}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* 3. Financial Summary */}
                                <div className="w-full md:w-auto min-w-[150px] text-right pl-4 border-l border-slate-100 flex justify-between md:block items-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Balance</p>
                                    <p className={`text-base font-bold font-mono tracking-tight ${party.currentBalance > 0 ? 'text-emerald-700' : party.currentBalance < 0 ? 'text-red-700' : 'text-slate-800'}`}>
                                        ₹{(party.currentBalance || 0).toLocaleString()}
                                        <span className="text-[10px] ml-1 opacity-50 font-normal uppercase text-slate-500">
                                            {party.balanceType === 'toReceive' ? 'Dr' : 'Cr'}
                                        </span>
                                    </p>
                                </div>

                                {/* 4. Actions */}
                                <div className="flex items-start pl-2">
                                    <button
                                        onClick={() => handleEditParty(party)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-md transition-all"
                                        title="Edit Party Details"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddPartyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddParty}
                isSubmitting={isSubmitting}
            />
            <EditPartyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                party={selectedParty}
                onSubmit={handleUpdateParty}
            />
        </div>
    );
};

export default PartiesPage;

