const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

// 데이터베이스 연결
const connectDB = require('./utils/database');
connectDB();

// 애플리케이션 생성
const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정 개선
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || '*' 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// 상태 확인 라우트
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '서버가 정상적으로 실행 중입니다.' });
});

// API 라우트 정의
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// 더미 데이터 모드 (MongoDB 연결 실패 시를 대비한 폴백)
let useDummyData = process.env.USE_DUMMY_DATA === 'true' || false;

// MongoDB 연결 실패 시 더미 데이터 사용
if (useDummyData) {
  console.log('⚠️ 더미 데이터 모드로 실행 중입니다');
  
  // 더미 사용자 데이터
  const users = [
    { _id: '1', name: '김철수', email: 'user1@example.com', department: '화학과', role: 'user' },
    { _id: '2', name: '박영희', email: 'user2@example.com', department: '생물학과', role: 'user' },
    { _id: '3', name: '이지훈', email: 'user3@example.com', department: '물리학과', role: 'user' },
    { _id: '4', name: '정민지', email: 'admin@example.com', department: '관리부서', role: 'admin' },
  ];

  // 더미 장비 데이터
  const equipment = [
    { _id: '1', name: '냉장고 1', description: '일반용 냉장고', location: '1층 실험실', color: '#3B82F6' },
    { _id: '2', name: '냉장고 2', description: '식품용 냉장고', location: '2층 실험실', color: '#10B981' },
    { _id: '3', name: '냉장고 3', description: '시약용 냉장고', location: '2층 실험실', color: '#F59E0B' },
    { _id: '4', name: '냉장고 4', description: '시료 보관용', location: '3층 실험실', color: '#EF4444' },
    { _id: '5', name: '초저온냉장고', description: '-80℃ 보관용', location: '지하 1층', color: '#8B5CF6' },
  ];

  // 더미 예약 데이터
  const reservations = [
    {
      _id: '1',
      user: '1',
      equipment: '1',
      date: new Date('2025-04-20'),
      startTime: '2025-04-20T10:00:00',
      endTime: '2025-04-20T12:00:00',
      notes: '생물학 실험 시료 보관',
    },
    {
      _id: '2',
      user: '2',
      equipment: '2',
      date: new Date('2025-04-21'),
      startTime: '2025-04-21T14:00:00',
      endTime: '2025-04-21T16:00:00',
      notes: '화학 실험 시약 보관',
    },
    {
      _id: '3',
      user: '3',
      equipment: '5',
      date: new Date('2025-04-22'),
      startTime: '2025-04-22T09:00:00',
      endTime: '2025-04-22T11:00:00',
      notes: '장기 보관용 샘플',
    },
  ];

  // 더미 API 라우트
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u._id === req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    // 인증 헤더에서 토큰 추출 (실제 구현에서는 토큰 검증 필요)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // 더미 데이터에서는 첫 번째 사용자 반환
      res.json(users[0]);
    } else {
      res.status(401).json({ message: '인증되지 않았습니다.' });
    }
  });

  app.get('/api/equipment', (req, res) => {
    res.json(equipment);
  });

  app.get('/api/equipment/:id', (req, res) => {
    const item = equipment.find(e => e._id === req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: '장비를 찾을 수 없습니다.' });
    }
  });

  app.get('/api/reservations', (req, res) => {
    res.json(reservations);
  });

  app.get('/api/reservations/filter', (req, res) => {
    const { userId, equipmentId } = req.query;
    let filtered = [...reservations];
    
    if (userId) {
      filtered = filtered.filter(r => r.user === userId);
    }
    
    if (equipmentId) {
      filtered = filtered.filter(r => r.equipment === equipmentId);
    }
    
    res.json(filtered);
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
          _id: user._id,
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
}

// 정적 파일 제공 (프로덕션 환경)
if (process.env.NODE_ENV === 'production') {
  // 클라이언트 빌드 결과물 제공
  // vite.config.js에 설정된 경로와 일치시킴
  app.use(express.static(path.join(__dirname, '../../server/public')));
  
  // 클라이언트 라우팅을 위한 설정
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../server/public', 'index.html'));
  });
}

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 서버 시작 - 호스트를 0.0.0.0으로 설정하여 모든 네트워크 인터페이스에서 접근 가능하게 함
app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
});

module.exports = app;