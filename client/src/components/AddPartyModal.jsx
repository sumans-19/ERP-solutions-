import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const AddPartyModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [activeTab, setActiveTab] = useState('gst');
    const [formData, setFormData] = useState({
        // Basic
        name: '',
        gstin: '',
        phone: '',

        // GST & Address
        billingAddress: '',
        city: '',
        state: '',
        pincode: '',

        // Credit & Balance
        openingBalance: 0,
        balanceType: 'toReceive',
        creditLimitType: 'noLimit',
        customCreditLimit: '',

        // Initial Order
        initialOrder: {
            orderNumber: '',
            totalItems: '',
            ratePerItem: '',
            description: ''
        },

        // Additional Fields
        additionalFields: []
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleInitialOrderChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            initialOrder: { ...prev.initialOrder, [field]: value }
        }));
    };

    const addAdditionalField = () => {
        setFormData(prev => ({
            ...prev,
            additionalFields: [...prev.additionalFields, { key: '', value: '' }]
        }));
    };

    const updateAdditionalField = (index, field, value) => {
        const updated = [...formData.additionalFields];
        updated[index][field] = value;
        setFormData(prev => ({ ...prev, additionalFields: updated }));
    };

    const removeAdditionalField = (index) => {
        setFormData(prev => ({
            ...prev,
            additionalFields: prev.additionalFields.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            gstin: '',
            phone: '',
            billingAddress: '',
            city: '',
            state: '',
            pincode: '',
            openingBalance: 0,
            balanceType: 'toReceive',
            creditLimitType: 'noLimit',
            customCreditLimit: '',
            initialOrder: { orderNumber: '', totalItems: '', ratePerItem: '', description: '' },
            additionalFields: []
        });
        setActiveTab('gst');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'gst', label: 'GST & Address' },
        { id: 'credit', label: 'Credit & Balance' },
        { id: 'additional', label: 'Additional Fields' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">Add Party</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    {/* Basic Info Row */}
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Party Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter party name"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN</label>
                                <input
                                    type="text"
                                    placeholder="Enter GSTIN"
                                    value={formData.gstin}
                                    onChange={e => handleChange('gstin', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 bg-white px-6">
                        <div className="flex gap-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* GST & Address Tab */}
                        {activeTab === 'gst' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Address</label>
                                    <input
                                        type="text"
                                        placeholder="Street, locality"
                                        value={formData.billingAddress}
                                        onChange={e => handleChange('billingAddress', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={e => handleChange('city', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={e => handleChange('state', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode</label>
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            value={formData.pincode}
                                            onChange={e => handleChange('pincode', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Credit & Balance Tab */}
                        {activeTab === 'credit' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-3">Opening Balance</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={formData.openingBalance}
                                                onChange={e => handleChange('openingBalance', Number(e.target.value))}
                                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                            <div className="flex gap-4 items-center">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="balanceType"
                                                        value="toPay"
                                                        checked={formData.balanceType === 'toPay'}
                                                        onChange={e => handleChange('balanceType', e.target.value)}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-sm text-slate-700">To Pay</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="balanceType"
                                                        value="toReceive"
                                                        checked={formData.balanceType === 'toReceive'}
                                                        onChange={e => handleChange('balanceType', e.target.value)}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-sm text-slate-700">To Receive</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-3">Credit Limit</label>
                                        <div className="flex gap-4 items-center mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="creditLimitType"
                                                    value="noLimit"
                                                    checked={formData.creditLimitType === 'noLimit'}
                                                    onChange={e => handleChange('creditLimitType', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm text-slate-700">No Limit</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="creditLimitType"
                                                    value="custom"
                                                    checked={formData.creditLimitType === 'custom'}
                                                    onChange={e => handleChange('creditLimitType', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm text-slate-700">Custom Limit</span>
                                            </label>
                                        </div>
                                        {formData.creditLimitType === 'custom' && (
                                            <input
                                                type="number"
                                                placeholder="Enter credit limit"
                                                value={formData.customCreditLimit}
                                                onChange={e => handleChange('customCreditLimit', Number(e.target.value))}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Initial Purchase Order */}
                                <div className="pt-4 border-t border-slate-200">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Initial Purchase Order (optional)</h3>
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Order Number</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. PO-1003"
                                                value={formData.initialOrder.orderNumber}
                                                onChange={e => handleInitialOrderChange('orderNumber', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Total Items (Qty)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 30"
                                                value={formData.initialOrder.totalItems}
                                                onChange={e => handleInitialOrderChange('totalItems', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Rate per Item</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 100"
                                                value={formData.initialOrder.ratePerItem}
                                                onChange={e => handleInitialOrderChange('ratePerItem', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">What they order (description)</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Describe the items or services ordered"
                                            value={formData.initialOrder.description}
                                            onChange={e => handleInitialOrderChange('description', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Fields Tab */}
                        {activeTab === 'additional' && (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={addAdditionalField}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <Plus size={16} /> Add Another Field
                                </button>

                                {formData.additionalFields.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                                        <p className="text-sm text-slate-400">No additional fields added. Click above to add one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.additionalFields.map((field, index) => (
                                            <div key={index} className="flex gap-3 items-start">
                                                <input
                                                    type="text"
                                                    placeholder="Field name"
                                                    value={field.key}
                                                    onChange={e => updateAdditionalField(index, 'key', e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Field value"
                                                    value={field.value}
                                                    onChange={e => updateAdditionalField(index, 'value', e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalField(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPartyModal;
