import React, { useState, useEffect, useRef } from 'react';
import { getContacts, getChatMessages, sendMessage } from '../../services/api';
import { Send, User, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeChat = ({ user }) => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (user?.id || user?._id) {
            fetchContacts();
        }
    }, [user]);

    useEffect(() => {
        if (selectedContact && (user?.id || user?._id)) {
            fetchMessages(selectedContact._id);
            const interval = setInterval(() => fetchMessages(selectedContact._id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact, user]);

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
            const userId = user.id || user._id;
            const otherContacts = data.filter(c => c._id !== userId);
            setContacts(otherContacts);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const userId = user.id || user._id;
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
            const userId = user.id || user._id;
            await sendMessage({
                sender: userId,
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

    if (loading) return <div className="p-8">Loading chat...</div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
            {/* Contacts Sidebar */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.map(contact => (
                        <div
                            key={contact._id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedContact?._id === contact._id ? 'bg-white border-l-4 border-blue-600 shadow-sm' : 'hover:bg-slate-100 border-l-4 border-transparent'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                {contact.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate">{contact.name}</h3>
                                <p className="text-xs text-slate-500 capitalize">{contact.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/30">
                {selectedContact ? (
                    <>
                        <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {selectedContact.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{selectedContact.name}</h3>
                                <p className="text-xs text-slate-500 capitalize">{selectedContact.role}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                const userId = user.id || user._id;
                                const isMe = msg.sender === userId;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 border border-slate-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:bg-slate-300 shadow-md hover:shadow-lg disabled:shadow-none"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={40} />
                        </div>
                        <p className="text-lg font-medium">Select a contact to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeChat;
