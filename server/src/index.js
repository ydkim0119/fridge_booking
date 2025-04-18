const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// 애플리케이션 생성
const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API 라우트 (백엔드 연결 시 실제 구현)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '서버가 정상적으로 실행 중입니다.' });
});

// 더미 사용자 데이터
const users = [
  { id: 1, name: '김철수', email: 'user1@example.com', department: '화학과', role: 'user' },
  { id: 2, name: '박영희', email: 'user2@example.com', department: '생물학과', role: 'user' },
  { id: 3, name: '이지훈', email: 'user3@example.com', department: '물리학과', role: 'user' },
  { id: 4, name: '정민지', email: 'admin@example.com', department: '관리부서', role: 'admin' },
];

// 더미 장비 데이터
const equipment = [
  { id: 1, name: '냉장고 1', description: '일반용 냉장고', location: '1층 실험실', color: '#3B82F6' },
  { id: 2, name: '냉장고 2', description: '식품용 냉장고', location: '2층 실험실', color: '#10B981' },
  { id: 3, name: '냉장고 3', description: '시약용 냉장고', location: '2층 실험실', color: '#F59E0B' },
  { id: 4, name: '냉장고 4', description: '시료 보관용', location: '3층 실험실', color: '#EF4444' },
  { id: 5, name: '초저온냉장고', description: '-80℃ 보관용', location: '지하 1층', color: '#8B5CF6' },
];

// 더미 예약 데이터
const reservations = [
  {
    id: 1,
    title: '시료 보관',
    description: '생물학 실험 시료 보관',
    userId: 1,
    equipmentId: 1,
    startTime: '2025-04-20T10:00:00',
    endTime: '2025-04-20T12:00:00',
  },
  {
    id: 2,
    title: '화학 실험 보관',
    description: '화학 실험 시약 보관',
    userId: 2,
    equipmentId: 2,
    startTime: '2025-04-21T14:00:00',
    endTime: '2025-04-21T16:00:00',
  },
  {
    id: 3,
    title: '샘플 보관',
    description: '장기 보관용 샘플',
    userId: 3,
    equipmentId: 5,
    startTime: '2025-04-22T09:00:00',
    endTime: '2025-04-22T11:00:00',
  },
];

// 더미 API 라우트
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/equipment', (req, res) => {
  res.json(equipment);
});

app.get('/api/reservations', (req, res) => {
  res.json(reservations);
});

// 더미 인증 API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 간단한 인증 체크 (실제로는 비밀번호 확인 필요)
  const user = users.find(u => u.email === email);
  
  if (user) {
    // 실제 구현에서는 JWT 토큰 생성
    res.json({ 
      token: 'dummy_jwt_token', 
      user: { 
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      } 
    });
  } else {
    res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
});

// 정적 파일 제공 (프로덕션 환경)
if (process.env.NODE_ENV === 'production') {
  // 클라이언트 빌드 결과물 제공
  app.use(express.static(path.join(__dirname, '../public')));
  
  // 클라이언트 라우팅을 위한 설정
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

module.exports = app;
