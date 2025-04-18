const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token and authorization
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and add to req (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: '인증 실패: 토큰이 유효하지 않습니다' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: '인증 실패: 토큰이 없습니다' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
};

module.exports = { protect, admin };
