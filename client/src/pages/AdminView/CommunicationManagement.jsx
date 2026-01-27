import React, { useState, useEffect, useRef } from 'react';
import { getContacts, getChatMessages, sendMessage } from '../../services/api';
import { Send, User, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommunicationManagement = ({ user, noPadding = false }) => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    const userId = user?.id || user?._id;

    useEffect(() => {
        if (userId) {
            fetchContacts();
        }
    }, [userId]);

    useEffect(() => {
        if (selectedContact && userId) {
            fetchMessages(selectedContact._id);
            const interval = setInterval(() => fetchMessages(selectedContact._id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const data = await getContacts();
            // In Admin view, we primarily communicate with Employees
            const employeeList = data.filter(c => c.type === 'Employee');
            setContacts(employeeList);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const data = await getChatMessages(userId, contactId);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            await sendMessage({
                sender: userId,
                receiver: selectedContact._id,
                senderModel: 'User',
                receiverModel: 'Employee',
                content: newMessage
            });
            setNewMessage('');
            fetchMessages(selectedContact._id);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && contacts.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading communication...</div>;
    }

    return (
        <div className={`flex flex-col h-full overflow-hidden ${noPadding ? '' : 'bg-slate-50 p-4 sm:p-6'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Contacts List */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex-shrink-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <MessageSquare size={20} className="text-blue-600" /> Contacts
                        </h2>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                        {filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No contacts found.</div>
                        ) : (
                            filteredContacts.map(contact => (
                                <button
                                    key={contact._id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full text-left p-3 sm:p-4 transition-all hover:bg-slate-50 ${selectedContact?._id === contact._id ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ${selectedContact?._id === contact._id ? 'bg-blue-600' : 'bg-slate-400'
                                            }`}>
                                            {contact.name?.[0]?.toUpperCase() || <User size={18} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-900 text-sm truncate">{contact.name}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 truncate tracking-tight">{contact.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                                    {selectedContact.name?.[0]?.toUpperCase() || <User size={18} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{selectedContact.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">Online</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/50">
                                <AnimatePresence initial={false}>
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2">
                                            <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                                                <MessageSquare size={24} className="text-slate-300" />
                                            </div>
                                            <p>No messages yet. Send a note to {selectedContact.name}.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isSent = msg.sender === userId;
                                            return (
                                                <motion.div
                                                    key={msg._id || idx}
                                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm ${isSent
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                                                        }`}>
                                                        <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                                                        <p className={`text-[10px] mt-1.5 ${isSent ? 'text-blue-100' : 'text-slate-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-100 bg-white flex-shrink-0">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <p className="font-medium text-center">Select a contact to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunicationManagement;
