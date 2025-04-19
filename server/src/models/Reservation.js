const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  // 시간 필드에서 날짜 필드로 변경
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // 이전 시간 필드는 유지 (호환성을 위해)
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 시작 시간이 들어오면 startDate로 복사 (하위 호환성 유지)
reservationSchema.pre('save', function(next) {
  // startTime이 있고 startDate가 없는 경우, startDate에 저장
  if (this.startTime && !this.startDate) {
    this.startDate = new Date(this.startTime);
    // 시간 정보 제거 (일 단위만 사용)
    this.startDate.setHours(0, 0, 0, 0);
  }
  
  // endTime이 있고 endDate가 없는 경우, endDate에 저장
  if (this.endTime && !this.endDate) {
    this.endDate = new Date(this.endTime);
    // 다음날로 설정 (하루 뒤 날짜의 자정)
    this.endDate.setHours(0, 0, 0, 0);
    this.endDate.setDate(this.endDate.getDate() + 1);
  }
  
  // startDate만 있고 endDate가 없는 경우, endDate를 하루 뒤로 설정
  if (this.startDate && !this.endDate) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + 1);
  }
  
  next();
});

// 예약 일자 중복 검증 (일 단위로 수정)
reservationSchema.statics.checkOverlap = async function(equipmentId, startDate, endDate, excludeId = null) {
  // 날짜 객체로 변환
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 시간 정보 제거 (일 단위 비교)
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const query = {
    equipment: equipmentId,
    $or: [
      // 케이스 1: 새 예약이 기존 예약 내에 완전히 포함됨
      { startDate: { $lte: start }, endDate: { $gte: end } },
      // 케이스 2: 새 예약의 시작이 기존 예약 내에 있음
      { startDate: { $lte: start }, endDate: { $gt: start } },
      // 케이스 3: 새 예약의 종료가 기존 예약 내에 있음
      { startDate: { $lt: end }, endDate: { $gte: end } },
      // 케이스 4: 새 예약이 기존 예약을 완전히 포함함
      { startDate: { $gte: start }, endDate: { $lte: end } }
    ]
  };
  
  // 수정 시 기존 예약 제외
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlappingReservation = await this.findOne(query);
  return overlappingReservation;
};

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;