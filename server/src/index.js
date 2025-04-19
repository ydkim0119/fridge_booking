const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');

// 환경 변수 로드
dotenv.config();

// 애플리케이션 생성
const app = express();
const PORT = process.env.PORT || 5000;

// 더미 데이터 모드 (MongoDB 연결 실패 시를 대비한 폴백)
let useDummyData = process.env.USE_DUMMY_DATA === 'true' || false;

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
  // 데이터베이스 상태 확인을 위한 함수 import
  const { isDbConnected } = require('./utils/database');

  res.status(200).json({ 
    status: 'ok', 
    message: '서버가 정상적으로 실행 중입니다.',
    mode: useDummyData ? '더미 데이터 모드' : '실제 데이터 모드',
    db_connected: isDbConnected(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 데이터베이스 연결 비동기로 처리
const connectDB = require('./utils/database');
(async () => {
  try {
    console.log('MongoDB 연결 시도 중...');
    const connected = await connectDB();
    
    if (!connected) {
      useDummyData = true;
      console.log('🔄 MongoDB 연결 실패로 더미 데이터 모드로 전환합니다.');
    }
  } catch (err) {
    useDummyData = true;
    console.log('🔄 MongoDB 연결 오류로 더미 데이터 모드로 전환합니다.', err.message);
  }
  
  // 연결 상태와 관계없이 서버 계속 실행 - 데이터베이스 연결 문제가 발생해도 앱이 작동함
})();

// API 라우트 정의 - 파일명 수정
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// 더미 데이터 모드용 라우트
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

  // 더미 예약 데이터 (일 단위 예약으로 변경)
  const reservations = [
    {
      _id: '1',
      title: '시료 냉동 보관',
      user: '1',
      equipment: '1',
      startDate: new Date('2025-04-20'),
      endDate: new Date('2025-04-21'),
      notes: '생물학 실험 시료 보관',
    },
    {
      _id: '2',
      title: '화학 실험 시약',
      user: '2',
      equipment: '2',
      startDate: new Date('2025-04-21'),
      endDate: new Date('2025-04-22'),
      notes: '화학 실험 시약 보관',
    },
    {
      _id: '3',
      title: '장기 보관용 샘플',
      user: '3',
      equipment: '5',
      startDate: new Date('2025-04-22'),
      endDate: new Date('2025-04-23'),
      notes: '장기 보관용 샘플',
    },
  ];

  // 더미 API 라우트 수정 - _id 필드 사용하도록 변경
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
  
  // 사용자 생성 API 추가
  app.post('/api/users', (req, res) => {
    try {
      const newUser = req.body;
      newUser._id = String(Math.max(...users.map(u => parseInt(u._id))) + 1);
      // 비밀번호가 없는 경우 기본값 설정
      if (!newUser.password) {
        newUser.password = 'password123';
      }
      users.push(newUser);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('사용자 생성 에러:', error);
      res.status(500).json({ message: '서버 에러가 발생했습니다' });
    }
  });
  
  // 사용자 수정 API 추가
  app.put('/api/users/:id', (req, res) => {
    const userIndex = users.findIndex(u => u._id === req.params.id);
    if (userIndex !== -1) {
      const updatedUser = { ...users[userIndex], ...req.body };
      users[userIndex] = updatedUser;
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
  });
  
  // 사용자 삭제 API 추가
  app.delete('/api/users/:id', (req, res) => {
    const initialLength = users.length;
    const remainingUsers = users.filter(u => u._id !== req.params.id);
    
    if (remainingUsers.length < initialLength) {
      users.length = 0;
      users.push(...remainingUsers);
      res.json({ message: '사용자가 삭제되었습니다.' });
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
  
  // 장비 생성 API 추가
  app.post('/api/equipment', (req, res) => {
    const newEquipment = req.body;
    newEquipment._id = String(Math.max(...equipment.map(e => parseInt(e._id))) + 1);
    equipment.push(newEquipment);
    res.status(201).json(newEquipment);
  });
  
  // 장비 수정 API 추가
  app.put('/api/equipment/:id', (req, res) => {
    const equipIndex = equipment.findIndex(e => e._id === req.params.id);
    if (equipIndex !== -1) {
      const updatedEquipment = { ...equipment[equipIndex], ...req.body };
      equipment[equipIndex] = updatedEquipment;
      res.json(updatedEquipment);
    } else {
      res.status(404).json({ message: '장비를 찾을 수 없습니다.' });
    }
  });
  
  // 장비 삭제 API 추가
  app.delete('/api/equipment/:id', (req, res) => {
    const initialLength = equipment.length;
    const remainingEquipment = equipment.filter(e => e._id !== req.params.id);
    
    if (remainingEquipment.length < initialLength) {
      equipment.length = 0;
      equipment.push(...remainingEquipment);
      res.json({ message: '장비가 삭제되었습니다.' });
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
  
  // 예약 생성 API 추가
  app.post('/api/reservations', (req, res) => {
    const newReservation = {
      ...req.body,
      _id: String(Math.max(...reservations.map(r => parseInt(r._id))) + 1)
    };
    // 날짜 형식 변환
    if (typeof newReservation.startDate === 'string') {
      newReservation.startDate = new Date(newReservation.startDate);
    }
    if (typeof newReservation.endDate === 'string') {
      newReservation.endDate = new Date(newReservation.endDate);
    }
    
    reservations.push(newReservation);
    res.status(201).json(newReservation);
  });
  
  // 예약 수정 API 추가
  app.put('/api/reservations/:id', (req, res) => {
    const reservationIndex = reservations.findIndex(r => r._id === req.params.id);
    if (reservationIndex !== -1) {
      const updatedReservation = { ...reservations[reservationIndex], ...req.body };
      // 날짜 형식 변환
      if (typeof updatedReservation.startDate === 'string') {
        updatedReservation.startDate = new Date(updatedReservation.startDate);
      }
      if (typeof updatedReservation.endDate === 'string') {
        updatedReservation.endDate = new Date(updatedReservation.endDate);
      }
      
      reservations[reservationIndex] = updatedReservation;
      res.json(updatedReservation);
    } else {
      res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
    }
  });
  
  // 예약 삭제 API 추가
  app.delete('/api/reservations/:id', (req, res) => {
    const initialLength = reservations.length;
    const remainingReservations = reservations.filter(r => r._id !== req.params.id);
    
    if (remainingReservations.length < initialLength) {
      reservations.length = 0;
      reservations.push(...remainingReservations);
      res.json({ message: '예약이 삭제되었습니다.' });
    } else {
      res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
    }
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
  // 가능한 정적 파일 디렉토리 경로들
  const possibleStaticPaths = [
    path.join(__dirname, '../../client/dist'),        // 기본 클라이언트 빌드 디렉토리
    path.join(__dirname, '../public'),                // 서버 public 디렉토리
    path.join(__dirname, '../../client/build'),       // CRA 스타일 빌드 디렉토리
    path.join(__dirname, '../dist'),                  // 대체 서버 디렉토리
    path.join(__dirname, '../../dist'),               // 대체 루트 디렉토리
    path.join(__dirname, '../../client/public'),      // 클라이언트 public 디렉토리
    path.resolve(process.cwd(), 'client/dist'),       // CWD 기준 클라이언트 디렉토리
    path.resolve(process.cwd(), 'dist')               // CWD 기준 dist 디렉토리
  ];
  
  // 존재하는 디렉토리 찾기
  let staticPath = null;
  for (const dirPath of possibleStaticPaths) {
    if (fs.existsSync(dirPath)) {
      try {
        const dirStats = fs.statSync(dirPath);
        if (dirStats.isDirectory()) {
          staticPath = dirPath;
          break;
        }
      } catch (err) {
        console.error(`경로 검사 중 오류 발생: ${dirPath}`, err.message);
      }
    }
  }
  
  if (staticPath) {
    console.log('정적 파일 경로 (발견됨):', staticPath);
    
    // 정적 파일 제공 설정
    app.use(express.static(staticPath));
    
    // 클라이언트 라우팅을 위한 설정
    app.get('*', (req, res) => {
      // index.html 파일 경로
      const indexPath = path.join(staticPath, 'index.html');
      console.log('index.html 파일 경로:', indexPath);
      
      try {
        // 파일 존재 여부 확인
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // 디렉토리 내용 출력 (디버깅 용도)
          console.log('디렉토리 내용:');
          try {
            const files = fs.readdirSync(staticPath);
            console.log(files);
          } catch (err) {
            console.error('디렉토리 읽기 실패:', err.message);
          }
          
          res.status(404).send(`index.html 파일을 찾을 수 없습니다 (경로: ${indexPath}). 빌드가 올바르게 완료되었는지 확인하세요.`);
        }
      } catch (err) {
        console.error('파일 확인 중 오류 발생:', err.message);
        res.status(500).send(`서버 오류: ${err.message}`);
      }
    });
  } else {
    console.error('정적 파일 디렉토리를 찾을 수 없습니다. 다음 경로를 시도했습니다:');
    possibleStaticPaths.forEach(path => console.log(`- ${path}`));
    
    // 정적 파일 디렉토리를 찾을 수 없는 경우에도 API 요청은 계속 처리
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        // API 요청은 위에서 정의된 라우트로 처리됨
        next();
      } else {
        // 클라이언트 요청은 정적 파일 디렉토리 누락 오류 반환
        res.status(500).send('빌드된 클라이언트 파일을 찾을 수 없습니다. 클라이언트 빌드가 올바르게 수행되었는지 확인하세요.');
      }
    });
  }
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
  console.log(`운영 모드: ${process.env.NODE_ENV || 'development'}, 더미 데이터 모드: ${useDummyData ? '활성화' : '비활성화'}`);
});

module.exports = app;