const mongoose = require('mongoose');

// MongoDB 연결 URL (환경 변수에서 가져오거나 기본값 사용)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridge_booking';

// MongoDB 연결 상태 관리
let isConnected = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

// MongoDB 연결 함수
async function connectDB() {
  try {
    // 이미 연결된 경우
    if (isConnected) {
      console.log('이미 MongoDB에 연결되어 있습니다.');
      return true;
    }

    // 연결 시도 횟수 증가
    connectionAttempts++;
    
    // MongoDB 옵션 설정
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃 5초
      connectTimeoutMS: 10000,        // 연결 타임아웃 10초
    };
    
    // MongoDB 연결 시도
    await mongoose.connect(MONGODB_URI, options);
    
    // 연결 성공
    isConnected = true;
    connectionAttempts = 0; // 연결 시도 횟수 초기화
    console.log('MongoDB 연결 성공: ', MONGODB_URI);
    
    // 연결 해제 이벤트 감지
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다.');
      isConnected = false;
      setTimeout(() => {
        connectDB();
      }, 5000); // 5초 후 재연결 시도
    });
    
    // 오류 이벤트 감지
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 오류:', err);
      isConnected = false;
    });
    
    return true;
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    isConnected = false;
    
    // 환경 변수에서 더미 데이터 사용 여부 확인
    const useDummyData = process.env.USE_DUMMY_DATA === 'true';
    
    // 더미 데이터 모드가 활성화되어 있으면 프로세스 계속 실행
    if (useDummyData) {
      console.log('더미 데이터 모드로 전환합니다.');
      return false;
    }
    
    // 최대 시도 횟수에 도달하지 않았으면 재시도
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`MongoDB 연결 재시도 중... (${connectionAttempts}/${MAX_ATTEMPTS})`);
      
      // 지수 백오프 방식으로 대기 시간 증가 (1초, 2초, 4초, 8초, 16초)
      const delay = Math.pow(2, connectionAttempts - 1) * 1000;
      
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await connectDB();
          resolve(result);
        }, delay);
      });
    } else {
      // 최대 시도 횟수에 도달했을 때
      console.error(`MongoDB 연결 실패: 최대 시도 횟수(${MAX_ATTEMPTS}회)에 도달했습니다.`);
      console.log('더미 데이터 모드로 전환합니다.');
      return false;
    }
  }
}

// MongoDB 연결 상태 확인 함수
function isDbConnected() {
  return isConnected;
}

// 데이터베이스 종료 함수
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB 연결 종료됨');
  }
}

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
module.exports.closeDatabase = closeDatabase;