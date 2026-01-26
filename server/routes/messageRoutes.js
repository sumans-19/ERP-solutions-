const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get conversation between two users
router.get('/conversation/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversation', error: error.message });
  }
});

// Get all conversations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: -1 });
    
    // Group by conversation partners
    const conversations = {};
    messages.forEach(msg => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partnerName = msg.senderId === userId ? msg.receiverName : msg.senderName;
      
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partnerName,
          lastMessage: msg.text,
          lastMessageTime: msg.timestamp,
          unreadCount: 0
        };
      }
      
      // Count unread messages (where user is receiver and message is unread)
      if (msg.receiverId === userId && !msg.read) {
        conversations[partnerId].unreadCount++;
      }
    });
    
    res.json({ success: true, conversations: Object.values(conversations) });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations', error: error.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  try {
    const { senderId, senderName, receiverId, receiverName, text } = req.body;
    
    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const message = new Message({
      senderId,
      senderName,
      receiverId,
      receiverName,
      text
    });
    
    await message.save();
    
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
  }
});

// Mark messages as read
router.put('/mark-read', async (req, res) => {
  try {
    const { userId, partnerId } = req.body;
    
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Error marking messages as read', error: error.message });
  }
});

// Delete a message
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Error deleting message', error: error.message });
  }
});

module.exports = router;
