import React, { useState, useEffect } from 'react';
import { MessageSquare, Bell } from 'lucide-react';
import CommunicationManagement from './AdminView/CommunicationManagement';
import AdminBulletins from './AdminView/AdminBulletins';

const CommunicationHub = ({ activeSection, setActiveSection, user }) => {
    const normalizedSection = activeSection?.replace('admin-', '');
    const [activeTab, setActiveTab] = useState(normalizedSection === 'bulletin' ? 'bulletin' : 'chats');

    useEffect(() => {
        const section = activeSection?.replace('admin-', '');
        if (section === 'bulletin') setActiveTab('bulletin');
        else if (section === 'chats') setActiveTab('chats');
    }, [activeSection]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const prefix = activeSection?.startsWith('admin-') ? 'admin-' : '';
        setActiveSection(`${prefix}${tab}`);
    };

    return (
        <main className="flex-1 overflow-hidden bg-slate-50 flex flex-col">
            {/* Header & Tabs Container */}
            <div className="bg-white border-b border-slate-200 px-8 pt-8 pb-0 flex-shrink-0">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Communication Management</h1>
                        <p className="text-slate-500 font-medium text-sm">Coordinate with employees and broadcast announcements.</p>
                    </div>

                    <div className="flex gap-8">
                        <button
                            onClick={() => handleTabChange('chats')}
                            className={`flex items-center gap-2 px-4 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'chats'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                                }`}
                        >
                            <MessageSquare size={18} />
                            Direct Chats
                        </button>
                        <button
                            onClick={() => handleTabChange('bulletin')}
                            className={`flex items-center gap-2 px-4 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'bulletin'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                                }`}
                        >
                            <Bell size={18} />
                            Global Bulletin
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area - Fills remaining space */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full p-8 pt-0">
                    <div className="h-full pt-8">
                        {activeTab === 'chats' ? (
                            <CommunicationManagement user={user} noPadding={true} />
                        ) : (
                            <AdminBulletins />
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CommunicationHub;

