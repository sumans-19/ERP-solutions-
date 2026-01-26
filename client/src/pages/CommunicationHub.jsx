import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Bell, Send, Users, ChevronDown, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CommunicationHub = ({ activeSection, setActiveSection }) => {
    const [activeTab, setActiveTab] = useState(activeSection === 'bulletin' ? 'bulletin' : 'chats');
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [bulletinMessage, setBulletinMessage] = useState('');
    const [bulletins, setBulletins] = useState([]);
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
        // Bulletins will be fetched only when bulletin tab is active
    }, []);

    useEffect(() => {
        if (activeSection === 'bulletin') setActiveTab('bulletin');
        else if (activeSection === 'chats') setActiveTab('chats');
    }, [activeSection]);

    const fetchEmployees = async () => {
        try {
            console.log('Fetching employees from:', `${API_URL}/api/employees`);
            const response = await axios.get(`${API_URL}/api/employees`);
            console.log('Employees response:', response.data);
            console.log('Number of employees:', response.data?.length);
            if (response.data && response.data.length > 0) {
                console.log('First employee object:', response.data[0]);
            }
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBulletins = async () => {
        // Bulletins are stored in local state only for now
        // Backend route can be added later if needed
        console.log('Bulletins feature ready - messages will be stored locally');
    };

    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const sendChatMessage = async () => {
        if (!message.trim() || selectedEmployees.length === 0) return;

        // Store message in local state
        // Backend route can be added later if needed
        setChatMessages(prev => [...prev, {
            _id: Date.now().toString(),
            message,
            recipients: selectedEmployees,
            timestamp: new Date().toISOString()
        }]);
        setMessage('');
        alert('Message sent successfully (stored locally)');
    };

    const sendBulletin = async () => {
        if (!bulletinMessage.trim()) return;

        // Store bulletin in local state
        // Backend route can be added later if needed
        setBulletins(prev => [{
            _id: Date.now().toString(),
            message: bulletinMessage,
            timestamp: new Date().toISOString(),
            author: 'Admin'
        }, ...prev]);
        setBulletinMessage('');
        alert('Bulletin sent successfully (stored locally)');
    };

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Communication Management</h1>
                    <p className="text-slate-600">Send direct messages or broadcast bulletins to all employees</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => { setActiveTab('chats'); setActiveSection('chats'); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-colors ${activeTab === 'chats'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <MessageSquare size={20} />
                            Direct Chats
                        </button>
                        <button
                            onClick={() => { setActiveTab('bulletin'); setActiveSection('bulletin'); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-colors ${activeTab === 'bulletin'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Bell size={20} />
                            Global Bulletin
                        </button>
                    </div>

                    {/* Chats Tab Content */}
                    {activeTab === 'chats' && (
                        <div className="p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Select Employees (Multiple)
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {loading ? 'Loading...' : `${employees.length} employees available`}
                                    </span>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-lg hover:border-blue-500 transition-colors"
                                    >
                                        <span className="text-sm text-slate-700">
                                            {selectedEmployees.length === 0
                                                ? 'Select employees...'
                                                : `${selectedEmployees.length} employee(s) selected`}
                                        </span>
                                        <ChevronDown size={20} className="text-slate-400" />
                                    </button>

                                    {showEmployeeDropdown && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {loading ? (
                                                <div className="px-4 py-8 text-center text-slate-500">Loading employees...</div>
                                            ) : employees.length === 0 ? (
                                                <div className="px-4 py-8 text-center text-slate-500">No employees found</div>
                                            ) : (
                                                employees.map(emp => (
                                                    <label
                                                        key={emp._id}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEmployees.includes(emp._id)}
                                                            onChange={() => toggleEmployeeSelection(emp._id)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-slate-900">{emp.fullName || emp.name}</p>
                                                            <p className="text-xs text-slate-500">{emp.role || emp.designation || emp.employeeId || 'Employee'}</p>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Employees Tags */}
                                {selectedEmployees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {selectedEmployees.map(empId => {
                                            const emp = employees.find(e => e._id === empId);
                                            return emp ? (
                                                <span
                                                    key={empId}
                                                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                                >
                                                    {emp.fullName || emp.name}
                                                    <button
                                                        onClick={() => toggleEmployeeSelection(empId)}
                                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows="4"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={sendChatMessage}
                                disabled={!message.trim() || selectedEmployees.length === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                                <Send size={18} />
                                Send Message
                            </button>

                            {/* Chat History */}
                            {chatMessages.length > 0 && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Messages</h3>
                                    <div className="space-y-3">
                                        {chatMessages.map(chat => (
                                            <div key={chat._id} className="bg-slate-50 rounded-lg p-4">
                                                <p className="text-sm text-slate-900">{chat.message}</p>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Sent to {chat.recipients.length} employee(s) • {new Date(chat.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulletin Tab Content */}
                    {activeTab === 'bulletin' && (
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Bulletin Message (Broadcast to All Employees)
                                </label>
                                <textarea
                                    value={bulletinMessage}
                                    onChange={(e) => setBulletinMessage(e.target.value)}
                                    placeholder="Type your bulletin message here..."
                                    rows="4"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={sendBulletin}
                                disabled={!bulletinMessage.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                                <Bell size={18} />
                                Broadcast Bulletin
                            </button>

                            {/* Bulletin History */}
                            {bulletins.length > 0 && (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Bulletins</h3>
                                    <div className="space-y-3">
                                        {bulletins.map(bulletin => (
                                            <div key={bulletin._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <Bell className="text-blue-600 flex-shrink-0 mt-1" size={18} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-slate-900">{bulletin.message}</p>
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            By {bulletin.author} • {new Date(bulletin.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default CommunicationHub;
