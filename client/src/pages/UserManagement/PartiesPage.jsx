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
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm flex items-center gap-2"
                >
                    <PlusCircle size={18} />
                    Add Party
                </button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search parties..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
            </div>

            {/* Parties Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredParties.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <User size={48} className="mx-auto mb-3 text-slate-300" />
                        <p>No parties found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredParties.map(party => (
                            <div
                                key={party._id}
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 text-lg">{party.name}</h3>
                                        {party.gstin && (
                                            <p className="text-xs text-slate-500 mt-0.5">GSTIN: {party.gstin}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditParty(party)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit Party"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${party.status === 'Active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {party.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {party.phone && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={14} className="text-slate-400" />
                                            {party.phone}
                                        </div>
                                    )}
                                    {party.city && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            {party.city}{party.state ? `, ${party.state}` : ''}
                                        </div>
                                    )}
                                    {party.currentBalance !== undefined && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <span className="text-xs font-medium text-slate-500">Balance: </span>
                                            <span className={`text-sm font-bold ${party.currentBalance > 0 ? 'text-green-600' :
                                                party.currentBalance < 0 ? 'text-red-600' : 'text-slate-600'
                                                }`}>
                                                ${Math.abs(party.currentBalance).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
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
