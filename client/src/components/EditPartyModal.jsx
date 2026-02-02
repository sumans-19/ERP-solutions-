import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const EditPartyModal = ({ isOpen, onClose, party, onSubmit }) => {
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
        status: 'Active'
    });

    useEffect(() => {
        if (party) {
            setFormData({
                name: party.name || '',
                gstin: party.gstin || '',

                billingAddress: party.billingAddress || '',
                billingCity: party.billingCity || '',
                billingState: party.billingState || '',
                billingPincode: party.billingPincode || '',

                shippingAddress: party.shippingAddress || '',
                shippingCity: party.shippingCity || '',
                shippingState: party.shippingState || '',
                shippingPincode: party.shippingPincode || '',

                vendorCode: party.vendorCode || '',
                customerCode: party.customerCode || '',
                contactNames: party.contactNames && party.contactNames.length > 0 ? party.contactNames : [''],
                phoneNumbers: party.phoneNumbers && party.phoneNumbers.length > 0 ? party.phoneNumbers : [''],
                emails: party.emails && party.emails.length > 0 ? party.emails : [''],
                status: party.status || 'Active'
            });
        }
    }, [party]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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

    const copyBillingToShipping = () => {
        setFormData(prev => ({
            ...prev,
            shippingAddress: prev.billingAddress,
            shippingCity: prev.billingCity,
            shippingState: prev.billingState,
            shippingPincode: prev.billingPincode
        }));
    };

    const copyShippingToBilling = () => {
        setFormData(prev => ({
            ...prev,
            billingAddress: prev.shippingAddress,
            billingCity: prev.shippingCity,
            billingState: prev.shippingState,
            billingPincode: prev.shippingPincode
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanedData = {
            ...formData,
            contactNames: formData.contactNames.filter(i => i.trim() !== ''),
            phoneNumbers: formData.phoneNumbers.filter(i => i.trim() !== ''),
            emails: formData.emails.filter(i => i.trim() !== '')
        };
        onSubmit(party._id, cleanedData);
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-slate-800">Edit Party</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
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
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Billing Address Details</h3>
                            <button
                                type="button"
                                onClick={copyShippingToBilling}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors"
                            >
                                Copy from Shipping
                            </button>
                        </div>
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
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Shipping Address Details</h3>
                            <button
                                type="button"
                                onClick={copyBillingToShipping}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors"
                            >
                                Copy from Billing
                            </button>
                        </div>
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

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderDynamicList('Contact Names', 'contactNames', 'Contact Name')}
                            {renderDynamicList('Phone Numbers', 'phoneNumbers', 'Phone Number')}
                            {renderDynamicList('Emails', 'emails', 'Email ID')}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPartyModal;
