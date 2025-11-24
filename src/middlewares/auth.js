const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Middleware to protect routes and attach user info
function authenticate(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'Invalid Authorization header format' });

  const token = parts[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, username, role }
    next();
  }catch(err){
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(role){
  return (req, res, next) => {
    if(!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if(!req.user.role.includes(role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
    next();
  };
}

module.exports = { authenticate, requireRole };
