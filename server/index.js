require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { seedUsers } = require('./utils/seed');

console.log('--- SERVER BOOT SEQUENCE [VERSION 3.1-DEFINITIVE] ---');

const app = express();

// 1. GHOST CHECK - Root level route (NO PREFIX)
app.get('/elints-ping', (req, res) => {
  console.log('📡 PING RECEIVED: Server is alive and responding on Port 5001!');
  res.send('PONG - Elints Server is Active on 5001');
});

// 2. Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id', 'Accept']
}));
// CORS Pre-flight handled by middleware above

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ DATABASE: Connected successfully');
    const { seedUsers, seedPermissions } = require('./utils/seed');
    return Promise.all([seedUsers(), seedPermissions()]);
  })
  .then(() => console.log('✅ DATABASE: Seed complete [VERSION 4.0-DYNAMIC-AUTH]'))
  .catch(err => console.error('❌ DATABASE ERROR:', err.message));

// 4. Debug API Prefix
app.get('/api/health-check', (req, res) => {
  console.log('📡 HEALTH CHECK: /api prefix is working');
  res.json({ status: 'ok', server: 'elints-oms' });
});

// 5. Functional Routes
console.log('📡 ROUTES: Registering Item module...');
app.use('/api/items', require('./routes/itemRoutes'));

console.log('📡 ROUTES: Registering Order module...');
app.use('/api/orders', require('./routes/orderRoutes'));

console.log('📡 ROUTES: Registering Employee module...');
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/employees', require('./routes/employeeWorkloadRoutes'));

console.log('📡 ROUTES: Registering Party module...');
app.use('/api/parties', require('./routes/partyRoutes'));

console.log('📡 ROUTES: Registering Step Assignment module...');
app.use('/api/step-assignments', require('./routes/stepAssignmentRoutes'));

console.log('📡 ROUTES: Registering Inventory module...');
app.use('/api/inventory', require('./routes/inventoryRoutes'));

console.log('📡 ROUTES: Registering Stats module...');
app.use('/api/stats', require('./routes/statsRoutes'));

console.log('📡 ROUTES: Registering System Settings module...');
app.use('/api/system-settings', require('./routes/systemSettingsRoutes'));

console.log('📡 ROUTES: Registering Role Permission system...');
app.use('/api/role-permissions', require('./routes/rolePermissionRoutes'));

console.log('📡 ROUTES: Registering Task, Chat, and Bulletin modules...');
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/bulletins', require('./routes/bulletinRoutes'));

console.log('📡 ROUTES: Registering Auth module...');
app.use('/api', require('./routes/authRoutes'));

// 6. Final Fallback (MUST BE LAST)
app.use((req, res) => {
  console.log(`❌ 404 ERROR: No route matched for ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route Not Found',
    path: req.url,
    message: 'ELINTS-VERSION-3.1-ERROR: This route does not exist.'
  });
});

const PORT = 5001; // FORCED TO 5001
app.listen(PORT, () => {
  console.log('--- SERVER BOOT SEQUENCE COMPLETE ---');
  console.log(`🚀 Elints OMS Server is now listening on http://localhost:${PORT}`);
});