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
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
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

// 예약 시간 중복 검증
reservationSchema.statics.checkOverlap = async function(equipmentId, startTime, endTime, excludeId = null) {
  const query = {
    equipment: equipmentId,
    $or: [
      // 케이스 1: 새 예약이 기존 예약 내에 완전히 포함됨
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      // 케이스 2: 새 예약의 시작이 기존 예약 내에 있음
      { startTime: { $lte: startTime }, endTime: { $gte: startTime } },
      // 케이스 3: 새 예약의 종료가 기존 예약 내에 있음
      { startTime: { $lte: endTime }, endTime: { $gte: endTime } },
      // 케이스 4: 새 예약이 기존 예약을 완전히 포함함
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
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