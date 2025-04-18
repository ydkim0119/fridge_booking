const mongoose = require('mongoose');

// MongoDB 연결 URL (환경 변수에서 가져오거나 기본값 사용)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fridge_booking';

// MongoDB 연결 함수
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 에러:', error.message);
    // 실패 시 프로세스 종료
    process.exit(1);
  }
}

module.exports = connectDB;
