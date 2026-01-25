// Middleware to authenticate token (simplified version)
const authenticateToken = (req, res, next) => {
  // In a real app, you would verify a JWT token here
  // For now, we'll just check if the user role is present in headers
  const userRole = req.header('x-user-role');
  
  if (!userRole) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.user = { role: userRole };
  next();
};

module.exports = authenticateToken;
