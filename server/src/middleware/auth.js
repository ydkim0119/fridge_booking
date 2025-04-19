const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// 인증 검증 미들웨어 - 인증 없이 통과하도록 수정
const protect = function(req, res, next) {
  // 헤더에서 토큰 가져오기
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // 가짜 사용자 정보 설정 (인증 우회)
  req.user = {
    _id: '1',
    name: '기본 사용자',
    email: 'user@example.com',
    role: 'user'
  };
  
  // 토큰이 있는 경우 검증 시도
  if (token) {
    try {
      // 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 요청 객체에 사용자 정보 추가
      req.user = decoded;
    } catch (error) {
      // 토큰이 유효하지 않아도 기본 사용자로 진행
      console.log('토큰 검증 실패, 기본 사용자로 진행:', error.message);
    }
  }
  
  // 항상 다음 미들웨어로 진행
  next();
};

// 관리자 권한 검증 미들웨어 - 권한 없이 통과하도록 수정
const admin = function(req, res, next) {
  // 관리자 권한 항상 허용
  next();
};

module.exports = { protect, admin };
