const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: String,
  role: { type: String, enum: ['admin', 'planning', 'development', 'employee'], default: 'employee' }
});

module.exports = mongoose.model('User', userSchema);
