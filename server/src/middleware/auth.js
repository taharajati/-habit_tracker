const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'لطفاً وارد سیستم شوید' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [decoded.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ message: 'کاربر یافت نشد' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'توکن منقضی شده است. لطفاً دوباره وارد شوید' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'توکن نامعتبر است' });
    }
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'لطفاً وارد سیستم شوید' });
  }
}; 