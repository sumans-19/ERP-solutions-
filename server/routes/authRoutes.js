const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login: ${email}`);

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      console.log(`❌ Invalid credentials: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const allowedRoles = ['development', 'planning', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ Access denied: ${email} (${user.role})`);
      return res.status(403).json({ success: false, message: 'Unauthorized role' });
    }

    console.log(`✅ Login success: ${email}`);
    res.json({
      success: true,
      user: { id: user._id, name: user.companyName, role: user.role, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard stats
router.get('/dashboard-stats', (req, res) => {
  const role = req.header('x-user-role');
  if (role !== 'development' && role !== 'admin' && role !== 'planning') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ cashInHand: 45000, stockValue: 120000, toCollect: 15000, toPay: 8000 });
});

// List users (admin only)
router.get('/users', async (req, res) => {
  try {
    if (req.header('x-user-role') !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/users/:id', async (req, res) => {
  try {
    const { companyName, email, password } = req.body;
    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`👤 Profile Updated: ${user.email}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
