const User = require('../models/User');
const RolePermission = require('../models/RolePermission');

const seedUsers = async () => {
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
      console.log(`⚠️ Seed error for ${u.email}:`, err.message);
    }
  }
};

const seedPermissions = async () => {
  const sections = [
    'dashboard', 'items', 'orders', 'process', 'inventory',
    'users', 'reports', 'comm-hub', 'tasks', 'jobs',
    'admin-view', 'employee-view', 'planning-view',
    'profile-settings', 'system-settings'
  ];

  const defaultRoles = [
    {
      role: 'admin',
      permissions: sections.map(s => ({
        section: s,
        visibility: true,
        actions: { create: true, read: true, update: true, delete: true }
      }))
    },
    {
      role: 'planning',
      permissions: sections.map(s => ({
        section: s,
        visibility: ['items', 'orders', 'process'].includes(s),
        actions: { create: true, read: true, update: true, delete: false }
      }))
    },
    {
      role: 'employee',
      permissions: sections.map(s => ({
        section: s,
        visibility: ['dashboard', 'tasks', 'jobs', 'comm-hub'].includes(s), // Note: Sidebar IDs
        actions: { create: false, read: true, update: false, delete: false }
      }))
    }
  ];

  for (const r of defaultRoles) {
    try {
      await RolePermission.updateOne({ role: r.role }, { $setOnInsert: r }, { upsert: true });
    } catch (err) {
      console.log(`⚠️ Permission Seed error for ${r.role}:`, err.message);
    }
  }
};

module.exports = { seedUsers, seedPermissions };

