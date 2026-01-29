import React, { useState } from 'react';
import { X, Plus, Trash2, Minus } from 'lucide-react';

const AddPartyModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: '',
        gstin: '',

        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingPincode: '',

        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingPincode: '',

        vendorCode: '',
        customerCode: '',

        contactNames: [''],
        phoneNumbers: [''],
        emails: [''],

        openingBalance: 0,
        balanceType: 'toReceive',
        creditLimitType: 'noLimit',
        customCreditLimit: '',

        initialOrder: {
            orderNumber: '',
            totalItems: '',
            ratePerItem: '',
            description: ''
        },
        additionalFields: []
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Dynamic Field Handlers
    const handleArrayChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (field, index) => {
        if (formData[field].length > 1) {
            setFormData(prev => ({
                ...prev,
                [field]: prev[field].filter((_, i) => i !== index)
            }));
        }
    };

    const handleInitialOrderChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            initialOrder: { ...prev.initialOrder, [field]: value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Filter out empty strings from arrays
        const cleanedData = {
            ...formData,
            contactNames: formData.contactNames.filter(i => i.trim() !== ''),
            phoneNumbers: formData.phoneNumbers.filter(i => i.trim() !== ''),
            emails: formData.emails.filter(i => i.trim() !== '')
        };
        onSubmit(cleanedData);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            gstin: '',
            billingAddress: '',
            billingCity: '',
            billingState: '',
            billingPincode: '',
            shippingAddress: '',
            shippingCity: '',
            shippingState: '',
            shippingPincode: '',
            vendorCode: '',
            customerCode: '',
            contactNames: [''],
            phoneNumbers: [''],
            emails: [''],
            openingBalance: 0,
            balanceType: 'toReceive',
            creditLimitType: 'noLimit',
            customCreditLimit: '',
            initialOrder: { orderNumber: '', totalItems: '', ratePerItem: '', description: '' },
            additionalFields: []
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const renderDynamicList = (label, field, placeholder) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
            <div className="space-y-2">
                {formData[field].map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange(field, index, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <div className="flex gap-1">
                            {index === formData[field].length - 1 && (
                                <button
                                    type="button"
                                    onClick={() => addArrayItem(field)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            )}
                            {formData[field].length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayItem(field, index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-slate-800">Add Party</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor Code</label>
                            <input
                                type="text"
                                placeholder="Vendor Code"
                                value={formData.vendorCode}
                                onChange={e => handleChange('vendorCode', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Code</label>
                            <input
                                type="text"
                                placeholder="Customer Code"
                                value={formData.customerCode}
                                onChange={e => handleChange('customerCode', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Billing Address Details */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Billing Address Details</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Address</label>
                            <textarea
                                rows="2"
                                placeholder="Billing Address"
                                value={formData.billingAddress}
                                onChange={e => handleChange('billingAddress', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing City</label>
                                <input
                                    type="text"
                                    value={formData.billingCity}
                                    onChange={e => handleChange('billingCity', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing State</label>
                                <input
                                    type="text"
                                    value={formData.billingState}
                                    onChange={e => handleChange('billingState', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Pincode</label>
                                <input
                                    type="text"
                                    value={formData.billingPincode}
                                    onChange={e => handleChange('billingPincode', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address Details */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Shipping Address Details</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipping Address</label>
                            <textarea
                                rows="2"
                                placeholder="Shipping Address"
                                value={formData.shippingAddress}
                                onChange={e => handleChange('shippingAddress', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipping City</label>
                                <input
                                    type="text"
                                    value={formData.shippingCity}
                                    onChange={e => handleChange('shippingCity', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipping State</label>
                                <input
                                    type="text"
                                    value={formData.shippingState}
                                    onChange={e => handleChange('shippingState', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipping Pincode</label>
                                <input
                                    type="text"
                                    value={formData.shippingPincode}
                                    onChange={e => handleChange('shippingPincode', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Contacts Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderDynamicList('Contact Names', 'contactNames', 'Contact Name')}
                            {renderDynamicList('Phone Numbers', 'phoneNumbers', 'Phone Number')}
                            {renderDynamicList('Emails', 'emails', 'Email ID')}
                        </div>
                    </div>

                </form>

                <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Party'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPartyModal;
