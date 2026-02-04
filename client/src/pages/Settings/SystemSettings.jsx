import React, { useState, useEffect } from 'react';
import { Settings, Globe, Percent, Bell, Moon, Sun, Info, Save, CheckCircle, AlertTriangle, Smartphone, MapPin, Monitor, Database, Download, Mail, CreditCard, Hash } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import { generateFullBackupPDF } from '../../utils/backupExport';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

const SystemSettings = () => {
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState({
        businessName: '',
        companyLogo: '',
        email: '',
        address: '',
        phone: '',
        website: '',
        pan: '',
        tan: '',
        gstEnabled: true,
        gstNumber: '',
        gstRate: 18,
        defaultCurrency: 'INR',
        theme: 'light',
        emailNotifications: true,
        systemLogs: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                if (data) setSettings(data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateSystemSettings(settings);
            showNotification('System settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to update system settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Info, title: 'General Information' },
        { id: 'business', label: 'Business Details', icon: Globe, title: 'Business Contact & Location' },
        { id: 'tax', label: 'Tax & Currency', icon: Percent, title: 'Financial Configuration' },
        { id: 'display', label: 'Appearance', icon: Monitor, title: 'Theme & Display' },
        { id: 'notifications', label: 'Notifications', icon: Bell, title: 'Alert Preferences' },
        { id: 'data', label: 'Backups & Data', icon: Database, title: 'System Maintenance & Export' },
    ];

    const tabChange = (tabId) => {
        setActiveTab(tabId);
        const tab = tabs.find(t => t.id === tabId);
        setActiveSectionName(tab ? tab.title : 'Settings');
    };

    if (fetching) return <div className="p-8 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
                    <p className="text-slate-500 mt-2">Manage global application settings and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save All Changes
                        </>
                    )}
                </button>
            </motion.div>



            <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 p-4 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => tabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-md border border-slate-200/60 ring-1 ring-slate-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8 bg-white relative">
                    <div className="mb-6 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800">{activeSectionName}</h2>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {activeTab === 'general' && (
                                <div className="grid grid-cols-1 gap-6 max-w-2xl">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Application Name</label>
                                        <input
                                            type="text"
                                            value={settings.businessName}
                                            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                            placeholder="e.g. Elints OMS"
                                        />
                                        <p className="text-xs text-slate-400">This name will appear in the browser tab and reports.</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                                            <div>
                                                <p className="font-semibold text-slate-900">System Logging</p>
                                                <p className="text-xs text-slate-500 mt-1">Record detailed logs for debugging and auditing</p>
                                            </div>
                                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.systemLogs}
                                                    onChange={(e) => setSettings({ ...settings, systemLogs: e.target.checked })}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    style={{
                                                        right: settings.systemLogs ? '0' : 'auto',
                                                        left: settings.systemLogs ? 'auto' : '0',
                                                        borderColor: settings.systemLogs ? '#2563EB' : '#E5E7EB'
                                                    }}
                                                />
                                                <label
                                                    onClick={() => setSettings({ ...settings, systemLogs: !settings.systemLogs })}
                                                    className={`toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer ${settings.systemLogs ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                ></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'business' && (
                                <div className="grid grid-cols-1 gap-6 max-w-3xl">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <MapPin size={16} className="text-slate-400" /> Registered Address
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={settings.address}
                                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none resize-none"
                                            placeholder="Enter full business address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Smartphone size={16} className="text-slate-400" /> Contact Phone
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.phone}
                                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                                placeholder="+91 99999 00000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Mail size={16} className="text-slate-400" /> Business Email
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                                placeholder="business@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Globe size={16} className="text-slate-400" /> Website
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.website}
                                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tax' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                    <div className="p-6 bg-slate-50 rounded-md border border-slate-200/60 hover:border-blue-200 transition bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-md">
                                                <Percent size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800">GST Settings</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GST Number</label>
                                                    <input
                                                        type="text"
                                                        value={settings.gstNumber}
                                                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                                        placeholder="22AAAAA0000A1Z5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default Rate (%)</label>
                                                    <input
                                                        type="number"
                                                        value={settings.gstRate}
                                                        onChange={(e) => setSettings({ ...settings, gstRate: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.gstEnabled}
                                                    onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                                />
                                                <span>Enable GST Calculation</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-md border border-slate-200/60 hover:border-blue-200 transition bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-amber-100 text-amber-600 rounded-md">
                                                <CreditCard size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800">Tax Identification</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PAN Number</label>
                                                <input
                                                    type="text"
                                                    value={settings.pan}
                                                    onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="ABCDE1234F"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">TAN Number</label>
                                                <input
                                                    type="text"
                                                    value={settings.tan}
                                                    onChange={(e) => setSettings({ ...settings, tan: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="CHEP01234G"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-md border border-slate-200/60 hover:border-blue-200 transition bg-white shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                                <Globe size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800">Currency</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default Currency</label>
                                                <select
                                                    value={settings.defaultCurrency}
                                                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                >
                                                    <option value="INR">Indian Rupee (₹)</option>
                                                    <option value="USD">US Dollar ($)</option>
                                                    <option value="EUR">Euro (€)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'display' && (
                                <div className="space-y-6">
                                    <div className="flex gap-6 max-w-3xl">
                                        <button
                                            onClick={() => setSettings({ ...settings, theme: 'light' })}
                                            className={`flex-1 p-6 rounded-md border-2 flex flex-col items-center gap-4 transition-all duration-200 group ${settings.theme === 'light'
                                                ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20'
                                                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`p-4 rounded-full ${settings.theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-blue-500'}`}>
                                                <Sun size={32} />
                                            </div>
                                            <div>
                                                <span className={`block font-bold text-lg ${settings.theme === 'light' ? 'text-blue-900' : 'text-slate-700'}`}>Light Mode</span>
                                                <span className="text-xs text-slate-500">Clean, crisp interface for day usage</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, theme: 'dark' })}
                                            className={`flex-1 p-6 rounded-md border-2 flex flex-col items-center gap-4 transition-all duration-200 group ${settings.theme === 'dark'
                                                ? 'border-indigo-600 bg-slate-900 text-white shadow-sm'
                                                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`p-4 rounded-full ${settings.theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500'}`}>
                                                <Moon size={32} />
                                            </div>
                                            <div>
                                                <span className={`block font-bold text-lg ${settings.theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Dark Mode</span>
                                                <span className={`text-xs ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Easy on the eyes for night usage</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="max-w-2xl">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-5 bg-white rounded-md border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-md mt-1">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">Email Notifications</p>
                                                    <p className="text-sm text-slate-500 mt-1">Receive important updates, order confirmations, and security alerts directly to your inbox.</p>
                                                </div>
                                            </div>

                                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.emailNotifications}
                                                    onChange={(e) => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    style={{
                                                        right: settings.emailNotifications ? '0' : 'auto',
                                                        left: settings.emailNotifications ? 'auto' : '0',
                                                        borderColor: settings.emailNotifications ? '#2563EB' : '#E5E7EB'
                                                    }}
                                                />
                                                <label
                                                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                                                    className={`toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer ${settings.emailNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                ></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'data' && (
                                <div className="max-w-2xl">
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-md border border-slate-200">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="p-3 bg-blue-100 text-blue-600 rounded-md">
                                                    <Database size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">Full System Backup</h3>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        Generate a comprehensive PDF report containing all system data (Items, Orders, Parties, Inventory, etc.).
                                                        Use this to keep a physical or digital record for auditing purposes.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <button
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        const result = await generateFullBackupPDF();
                                                        if (result.success) {
                                                            showNotification(`Backup generated: ${result.filename}`);
                                                        } else {
                                                            showNotification(`Backup failed: ${result.error}`, 'error');
                                                        }
                                                        setLoading(false);
                                                    }}
                                                    disabled={loading}
                                                    className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 disabled:bg-slate-300 disabled:shadow-none uppercase tracking-widest text-xs"
                                                >
                                                    <Download size={18} />
                                                    {loading ? 'Processing Backup...' : 'Generate & Download PDF Backup'}
                                                </button>
                                                <p className="text-[10px] text-slate-400 text-center font-medium">
                                                    Note: Large databases may take a few seconds to generate.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-3">
                                            <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Important Note</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    This backup tool generates a visual report (PDF). It is meant for printing and digital archiving,
                                                    not for restoring database state. For technical database backups, please consult your system administrator.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;

