require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { seedUsers } = require('./utils/seed');

console.log('--- SERVER BOOT SEQUENCE [VERSION 4.6-STABLE] ---');

const app = express();

// 2. Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id', 'Accept']
}));

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ DATABASE: Connected successfully');
  })
  .catch(err => console.error('❌ DATABASE ERROR:', err.message));

// 4. Functional Routes
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/employees', require('./routes/employeeWorkloadRoutes'));
app.use('/api/parties', require('./routes/partyRoutes'));
app.use('/api/step-assignments', require('./routes/stepAssignmentRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/system-settings', require('./routes/systemSettingsRoutes'));
app.use('/api/raw-materials', require('./routes/rawMaterialRoutes'));
app.use('/api/material-requests', require('./routes/materialRequestRoutes'));
app.use('/api/grn', require('./routes/grnRoutes'));
app.use('/api/wip-stock', require('./routes/wipRoutes'));
app.use('/api/finished-goods', require('./routes/fgRoutes'));
app.use('/api/rejected-goods', require('./routes/rejectedGoodRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/role-permissions', require('./routes/rolePermissionRoutes'));
app.use('/api/bulletins', require('./routes/bulletinRoutes'));
app.use('/api/job-cards', require('./routes/jobCardRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error('--- GLOBAL ERROR CAUGHT ---');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: err.name,
    stack: err.stack
  });
});

// 6. Final Fallback (MUST BE LAST)
app.use((req, res) => {
  console.log(`❌ 404 ERROR: No route matched for ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route Not Found',
    path: req.url,
    message: 'ELINTS-VERSION-3.1-ERROR: This route does not exist.'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('--- SERVER BOOT SEQUENCE COMPLETE ---');
  console.log(`🚀 Elints OMS Server is now listening on http://localhost:${PORT}`);
});