const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Employee = require('../models/Employee');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Get all contacts with last message preview
router.get('/contacts/all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all employees and users
        const employees = await Employee.find({}, 'fullName employeeId designation role');
        const users = await User.find({ role: { $in: ['admin', 'development'] } }, 'email role');

        // Basic contacts list
        let contacts = [
            ...employees.map(emp => ({
                _id: emp._id.toString(),
                name: emp.fullName,
                role: emp.designation || emp.role || 'Employee',
                type: 'Employee',
                email: emp.email // specific to employee model usually
            })),
            ...users.map(user => ({
                _id: user._id.toString(),
                name: user.email, // Users often use email as name if no name field
                role: user.role,
                type: 'User',
                email: user.email
            }))
        ];

        // Aggregate last messages for this user
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId.toString() },
                        { receiver: userId.toString() }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [{ $eq: ["$sender", userId.toString()] }, "$receiver", "$sender"]
                    },
                    content: { $first: "$content" },
                    timestamp: { $first: "$timestamp" },
                    sender: { $first: "$sender" },
                    read: { $first: "$read" }
                }
            }
        ]);

        // Map messages to contacts
        const msgMap = {};
        lastMessages.forEach(msg => {
            msgMap[msg._id] = msg;
        });

        contacts = contacts.map(c => {
            const lastMsg = msgMap[c._id];
            return {
                ...c,
                lastMessage: lastMsg ? lastMsg.content : null,
                lastMessageTime: lastMsg ? lastMsg.timestamp : null,
                isLastMsgRead: lastMsg ? (lastMsg.sender === userId ? true : lastMsg.read) : true
            };
        });

        // Sort: Contacts with recent messages first
        contacts.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get conversation between two users
router.get('/:userId/:contactId', authenticateToken, async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: contactId },
                { sender: contactId, receiver: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: error.message });
    }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { sender, receiver, senderModel, receiverModel, content } = req.body;

        const message = new Message({
            sender,
            receiver,
            senderModel,
            receiverModel,
            content
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: error.message });
    }
});

// Mark messages as read
router.patch('/read/:userId/:contactId', authenticateToken, async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        await Message.updateMany(
            { sender: contactId, receiver: userId, read: false },
            { read: true }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
