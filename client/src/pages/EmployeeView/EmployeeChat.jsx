import React, { useState, useEffect, useRef } from 'react';
import { getContacts, getChatMessages, sendMessage, markMessagesAsRead } from '../../services/api';
import { Send, User, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

const EmployeeChat = ({ user }) => {
    const { selectedEmployeeId, employees } = useEmployeeView(); // Get employees from context
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchContacts();
            const contactInterval = setInterval(fetchContacts, 10000);
            return () => clearInterval(contactInterval);
        }
    }, [selectedEmployeeId, employees]); // Add employees to dependency

    useEffect(() => {
        if (selectedContact && selectedEmployeeId) {
            fetchMessages(selectedContact._id);
            markMessagesAsRead(selectedEmployeeId, selectedContact._id);
            const interval = setInterval(() => fetchMessages(selectedContact._id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact, selectedEmployeeId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchContacts = async () => {
        try {
            setLoading(true);

            // Use employees from context (guaranteed to be there if dropdown works)
            const employeeContacts = employees
                .filter(c => c._id !== selectedEmployeeId)
                .map(e => ({
                    ...e,
                    type: 'Employee'
                }));

            // Try to fetch updated contacts (admins/users) from API
            try {
                const data = await getContacts();
                // Filter out current selected employee from API data too
                const apiContacts = data.filter(c => c._id !== selectedEmployeeId);

                // Merge or prefer API contacts if available, but fallback to context employees
                if (apiContacts.length > 0) {
                    setContacts(apiContacts);
                } else {
                    setContacts(employeeContacts);
                }
            } catch (err) {
                console.warn("API contacts fetch failed, using context employees", err);
                setContacts(employeeContacts);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const data = await getChatMessages(selectedEmployeeId, contactId);
            setMessages(data);
            const hasUnread = data.some(m => m.receiver === selectedEmployeeId && !m.read);
            if (hasUnread) {
                await markMessagesAsRead(selectedEmployeeId, contactId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            await sendMessage({
                sender: selectedEmployeeId,
                receiver: selectedContact._id,
                senderModel: 'Employee',
                receiverModel: selectedContact.type || 'User',
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

    if (!selectedEmployeeId) {
        return null; // Layout handles empty state
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading chat...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full overflow-hidden">
            {/* Contacts List */}
            <div className="lg:col-span-1 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px] lg:max-h-full">
                <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
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
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No contacts found.</div>
                    ) : (
                        filteredContacts.map(contact => (
                            <button
                                key={contact._id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full text-left p-3 sm:p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedContact?._id === contact._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${selectedContact?._id === contact._id ? 'bg-blue-600' : 'bg-slate-400'
                                        }`}>
                                        {contact.name?.[0]?.toUpperCase() || <User size={18} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 text-sm truncate">{contact.name}</p>
                                        {contact.lastMessage ? (
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className={`text-[11px] sm:text-xs truncate max-w-[70%] ${!contact.isLastMsgRead ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                    {contact.lastMessage}
                                                </p>
                                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                    {new Date(contact.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 truncate">{contact.email}</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[600px] lg:max-h-full">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {selectedContact.name?.[0]?.toUpperCase() || <User size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{selectedContact.name}</h3>
                                <p className="text-xs text-slate-500 truncate">{selectedContact.email}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50">
                            <AnimatePresence>
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isSent = msg.sender === selectedEmployeeId;
                                        return (
                                            <motion.div
                                                key={msg._id || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-md ${isSent
                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                                                    }`}>
                                                    <p className="text-sm break-words">{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${isSent ? 'text-blue-100' : 'text-slate-400'}`}>
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
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    <span className="hidden sm:inline">Send</span>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} />
                        </div>
                        <p className="font-medium text-center">Select a contact to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeChat;

