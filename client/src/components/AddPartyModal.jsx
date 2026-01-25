import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddPartyModal = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('gst');
    const [formData, setFormData] = useState({
        name: '',
        gstin: '',
        phone: '',
        billingAddress: '',
        city: '',
        state: '',
        pincode: '',
        openingBalance: '0',
        paymentType: 'toReceive', // toPay or toReceive
        creditLimitType: 'noLimit', // noLimit or custom
        customCreditLimit: '',
        initialOrderNo: '',
        initialOrderQty: '',
        initialOrderRate: '',
        initialOrderDesc: '',
        additionalFields: []
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddField = () => {
        setFormData(prev => ({
            ...prev,
            additionalFields: [...prev.additionalFields, { key: '', value: '' }]
        }));
    };

    const handleFieldChange = (index, field, value) => {
        const newFields = [...formData.additionalFields];
        newFields[index][field] = value;
        setFormData(prev => ({ ...prev, additionalFields: newFields }));
    };

    const removeField = (index) => {
        const newFields = formData.additionalFields.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, additionalFields: newFields }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <h2 className="text-xl font-bold text-slate-800">Add Party</h2>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form id="add-party-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Top Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Party Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                placeholder="Enter party name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">GSTIN</label>
                                            <input
                                                type="text"
                                                name="gstin"
                                                placeholder="Enter GSTIN"
                                                value={formData.gstin}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Enter phone number"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Tabs Navigation */}
                                    <div className="border-b border-slate-200 flex gap-6">
                                        {['gst', 'credit', 'additional'].map((tab) => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveTab(tab)}
                                                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab
                                                    ? 'text-blue-600'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {tab === 'gst' && 'GST & Address'}
                                                {tab === 'credit' && 'Credit & Balance'}
                                                {tab === 'additional' && 'Additional Fields'}
                                                {activeTab === tab && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tabs Content */}
                                    <div className="min-h-[200px]">
                                        {activeTab === 'gst' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                            >
                                                <div className="col-span-1 md:col-span-1 space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing Address</label>
                                                    <textarea
                                                        name="billingAddress"
                                                        rows="4"
                                                        placeholder="Street, locality"
                                                        value={formData.billingAddress}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
                                                    ></textarea>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">City</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            placeholder="City"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">State</label>
                                                            <input
                                                                type="text"
                                                                name="state"
                                                                placeholder="State"
                                                                value={formData.state}
                                                                onChange={handleInputChange}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pincode</label>
                                                            <input
                                                                type="text"
                                                                name="pincode"
                                                                placeholder="Pincode"
                                                                value={formData.pincode}
                                                                onChange={handleInputChange}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'credit' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-8"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opening Balance</label>
                                                            <input
                                                                type="text"
                                                                name="openingBalance"
                                                                value={formData.openingBalance}
                                                                onChange={handleInputChange}
                                                                className="w-32 p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="paymentType"
                                                                    value="toPay"
                                                                    checked={formData.paymentType === 'toPay'}
                                                                    onChange={handleInputChange}
                                                                    className="text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-slate-700">To Pay</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="paymentType"
                                                                    value="toReceive"
                                                                    checked={formData.paymentType === 'toReceive'}
                                                                    onChange={handleInputChange}
                                                                    className="text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-slate-700">To Receive</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Credit Limit</label>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name="creditLimitType"
                                                                        value="noLimit"
                                                                        checked={formData.creditLimitType === 'noLimit'}
                                                                        onChange={handleInputChange}
                                                                        className="text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-slate-700">No Limit</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name="creditLimitType"
                                                                        value="custom"
                                                                        checked={formData.creditLimitType === 'custom'}
                                                                        onChange={handleInputChange}
                                                                        className="text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-slate-700">Custom Limit</span>
                                                                </label>
                                                            </div>
                                                            {formData.creditLimitType === 'custom' && (
                                                                <input
                                                                    type="text"
                                                                    name="customCreditLimit"
                                                                    placeholder="Enter limit"
                                                                    value={formData.customCreditLimit}
                                                                    onChange={handleInputChange}
                                                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100">
                                                    <label className="text-sm font-semibold text-slate-700 mb-4 block">Initial Purchase Order (optional)</label>
                                                    <div className="grid grid-cols-3 gap-6 mb-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs text-slate-500">Order Number</label>
                                                            <input
                                                                type="text"
                                                                name="initialOrderNo"
                                                                placeholder="e.g. PO-1003"
                                                                value={formData.initialOrderNo}
                                                                onChange={handleInputChange}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs text-slate-500">Total Items (Qty)</label>
                                                            <input
                                                                type="text"
                                                                name="initialOrderQty"
                                                                placeholder="e.g. 30"
                                                                value={formData.initialOrderQty}
                                                                onChange={handleInputChange}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs text-slate-500">Rate per Item</label>
                                                            <input
                                                                type="text"
                                                                name="initialOrderRate"
                                                                placeholder="e.g. 100"
                                                                value={formData.initialOrderRate}
                                                                onChange={handleInputChange}
                                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs text-slate-500">What they order (description)</label>
                                                        <textarea
                                                            name="initialOrderDesc"
                                                            rows="2"
                                                            placeholder="Describe the items or services ordered"
                                                            value={formData.initialOrderDesc}
                                                            onChange={handleInputChange}
                                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
                                                        ></textarea>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'additional' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-4"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleAddField}
                                                    className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-700 transition"
                                                >
                                                    <Plus size={16} /> Add Another Field
                                                </button>

                                                <div className="space-y-3">
                                                    {formData.additionalFields.length === 0 ? (
                                                        <div className="p-8 border-2 border-dashed border-slate-100 rounded-xl text-center text-slate-400 text-sm">
                                                            No additional fields added. Click above to add one.
                                                        </div>
                                                    ) : (
                                                        formData.additionalFields.map((field, index) => (
                                                            <div key={index} className="flex gap-4 items-start">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Field Name"
                                                                    value={field.key}
                                                                    onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                                                                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Value"
                                                                    value={field.value}
                                                                    onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                                                                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeField(index)}
                                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="add-party-form"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddPartyModal;
