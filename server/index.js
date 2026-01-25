const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// call seeding after successful connection
mongoose.connection.once('open', () => {
    seedUsers().then(() => console.log('Seed complete')).catch(e => console.log('Seed error', e));
});

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In real app, hash this!
    companyName: String,
    role: { type: String, enum: ['admin','planning','development','employee'], default: 'employee' }
});
const User = mongoose.model('User', userSchema);

// --- Seed initial users (for development) ---
async function seedUsers() {
    const users = [
        { email: 'admin@elints.com', password: 'admin@123', companyName: 'Elints', role: 'admin' },
        { email: 'planning@elints.com', password: 'planning@123', companyName: 'Elints', role: 'planning' },
        { email: 'dev@elints.com', password: 'dev@123', companyName: 'Elints', role: 'development' },
        { email: 'emp1@elints.com', password: 'emp1@123', companyName: 'Elints', role: 'employee' },
        { email: 'emp2@elints.com', password: 'emp2@123', companyName: 'Elints', role: 'employee' },
        { email: 'emp3@elints.com', password: 'emp3@123', companyName: 'Elints', role: 'employee' },
    ];

    for (const u of users) {
        try {
            await User.updateOne({ email: u.email }, { $setOnInsert: u }, { upsert: true });
        } catch (err) {
            console.log('Seed user error', u.email, err.message);
        }
    }
}

// --- Routes ---
// 1. Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt: ${email}`);
    // Simple check (Add bcrypt in production)
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`❌ User not found: ${email}`);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.password !== password) {
        console.log(`❌ Wrong password for: ${email}`);
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    // STRICT: Only development team can login and access dashboard
    if (user.role !== 'development') {
        console.log(`❌ Access denied for non-dev user: ${email} (role: ${user.role})`);
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Only development team members can access this system." 
        });
    }
    console.log(`✅ Login success: ${email}`);
    res.json({ success: true, user: { id: user._id, name: user.companyName, role: user.role, email: user.email } });
});

// 2. Dashboard Stats Route (Dummy Data for UI)
app.get('/api/dashboard-stats', (req, res) => {
    // Only development role should access detailed stats for now
    const role = req.header('x-user-role') || 'development';
    if (role !== 'development') {
        return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    res.json({
        cashInHand: 45000,
        stockValue: 120000,
        toCollect: 15000,
        toPay: 8000
    });
});

// Admin-only: list users (for debugging)
app.get('/api/users', async (req, res) => {
    const role = req.header('x-user-role') || 'development';
    if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const users = await User.find({}, '-password');
    res.json(users);
});

// --- Item Routes ---
const itemRoutes = require('./routes/itemRoutes');
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));