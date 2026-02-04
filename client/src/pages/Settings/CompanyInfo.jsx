import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, MapPin, CreditCard, Save, CheckCircle, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

const CompanyInfo = () => {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [settings, setSettings] = useState({
        businessName: '',
        companyLogo: '',
        email: '',
        address: '',
        phone: '',
        pan: '',
        tan: '',
        website: '',
        gstNumber: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getSystemSettings();
            if (data) setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateSystemSettings(settings);
            showNotification('Company information updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to update company information', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, companyLogo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setSettings({ ...settings, companyLogo: '' });
    };

    if (fetching) return <div className="p-8 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Company Profile</h1>
                    <p className="text-slate-500 mt-2">Manage your organization's identity and contact details</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:bg-slate-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    Save Profile
                </button>
            </motion.div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 flex flex-col items-center">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 w-full">Company Logo</h3>

                        <div className="relative group w-40 h-40 mb-6">
                            <div className="w-full h-full rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-blue-400 transition-colors">
                                {settings.companyLogo ? (
                                    <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <Building2 size={48} strokeWidth={1.5} />
                                        <span className="text-xs mt-2 font-medium">No Logo</span>
                                    </div>
                                )}
                            </div>

                            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                <Upload className="text-white" size={24} />
                            </label>

                            {settings.companyLogo && (
                                <button
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-md shadow-sm hover:bg-red-200 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-400 text-center leading-relaxed">
                            Upload your company logo in PNG or JPG format.<br />Recommended size: 512x512px.
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={settings.businessName}
                                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="Elints Prints Group"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="info@elintprints.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="+91 99999 00000"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <textarea
                                        rows="3"
                                        value={settings.address}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium resize-none"
                                        placeholder="Enter complete office/factory address"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={settings.website}
                                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="www.elintprints.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={settings.gstNumber}
                                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                                        placeholder="27AAAAA0000A1Z5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PAN Number</label>
                                <input
                                    type="text"
                                    value={settings.pan}
                                    onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium uppercase"
                                    placeholder="ABCDE1234F"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">TAN Number</label>
                                <input
                                    type="text"
                                    value={settings.tan}
                                    onChange={(e) => setSettings({ ...settings, tan: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium uppercase"
                                    placeholder="ABCD12345E"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfo;

