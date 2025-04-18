const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
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
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'canceled'],
    default: 'approved' // 기본값은 approved로 설정 (필요시 pending으로 변경 가능)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// 예약 시간 중복 확인을 위한 정적 메서드
ReservationSchema.statics.checkOverlap = async function(equipmentId, startTime, endTime, excludeId = null) {
  const query = {
    equipmentId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      // 새 예약의 시작 시간이 기존 예약 범위 내에 있는 경우
      { startTime: { $lt: endTime, $gte: startTime } },
      // 새 예약의 종료 시간이 기존 예약 범위 내에 있는 경우
      { endTime: { $gt: startTime, $lte: endTime } },
      // 새 예약이 기존 예약을 완전히 포함하는 경우
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      // 기존 예약이 새 예약을 완전히 포함하는 경우
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };

  // 수정 시 자기 자신은 제외
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const overlappingReservation = await this.findOne(query);
  return overlappingReservation;
};

const Reservation = mongoose.model('Reservation', ReservationSchema);

module.exports = Reservation;
