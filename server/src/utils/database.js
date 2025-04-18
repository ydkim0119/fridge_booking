const mongoose = require('mongoose');

// MongoDB 연결 URL (환경 변수에서 가져오거나 기본값 사용)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridge_booking';

// MongoDB 연결 함수
async function connectDB() {
  try {
    // deprecated 옵션 제거 (MongoDB Driver 4.0.0 이상에서는 필요 없음)
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 연결 성공');
    return true;
  } catch (error) {
    console.error('MongoDB 연결 에러:', error.message);
    
    // 환경 변수에서 더미 데이터 사용 여부 확인
    const useDummyData = process.env.USE_DUMMY_DATA === 'true';
    
    // 더미 데이터 모드가 활성화되어 있으면 프로세스 계속 실행
    if (useDummyData) {
      console.log('더미 데이터 모드로 전환합니다.');
      return false;
    }
    
    // 더미 데이터 모드가 아니라면 5초 후 재시도
    console.log('5초 후 MongoDB 연결을 다시 시도합니다...');
    setTimeout(() => {
      connectDB();
    }, 5000);
    
    return false;
  }
}

module.exports = connectDB;
