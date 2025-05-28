import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

const authenticate = (req, res, next) => {
  const token = req.header('Authorization');

  // Skip authentication for Swagger documentation routes
  if (req.path.startsWith('/api-docs') || req.path === '/api-docs.json') {
    return next();
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export default authenticate;
