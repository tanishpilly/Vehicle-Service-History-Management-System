const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vehicle_service_secret_key_2026_dbms';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join(' or ')} users.`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
