import React, { useState } from 'react';
import { Users, History, Briefcase, GitBranch } from 'lucide-react';
import PartiesPage from './PartiesPage';
import PartyFollowUpsPage from './PartyFollowUpsPage';
import EmployeesPage from './EmployeesPage';
import MappingPage from './MappingPage';

const UserManagement = ({ initialTab = 'parties' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    const tabs = [
        { id: 'parties', label: 'Parties', icon: Users },
        { id: 'followups', label: 'Follow Ups', icon: History },
        { id: 'employees', label: 'Employees', icon: Briefcase },
        { id: 'mapping', label: 'Mapping', icon: GitBranch }
    ];

    return (
        <div className="h-full w-full flex flex-col bg-slate-50">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-slate-200 px-6">
                <div className="flex gap-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-hidden">
                {activeTab === 'parties' && <PartiesPage />}
                {activeTab === 'followups' && <PartyFollowUpsPage />}
                {activeTab === 'employees' && <EmployeesPage />}
                {activeTab === 'mapping' && <MappingPage />}
            </div>
        </div>
    );
};

export default UserManagement;

