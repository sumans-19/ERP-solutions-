const User = require('../models/User');

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

module.exports = { seedUsers };
