const express = require('express');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

// 모든 예약 조회
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .sort({ startTime: 1 })
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');
    res.json(reservations);
  } catch (error) {
    console.error('예약 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 특정 사용자의 예약 조회
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    // 관리자가 아닌 경우, 자신의 예약만 볼 수 있음
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    const reservations = await Reservation.find({ userId })
      .sort({ startTime: 1 })
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');
    res.json(reservations);
  } catch (error) {
    console.error('사용자 예약 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 특정 장비의 예약 조회
router.get('/equipment/:equipmentId', auth, async (req, res) => {
  try {
    const equipmentId = req.params.equipmentId;
    const reservations = await Reservation.find({ equipmentId })
      .sort({ startTime: 1 })
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');
    res.json(reservations);
  } catch (error) {
    console.error('장비 예약 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 특정 기간의 예약 조회
router.get('/period', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: '시작 날짜와 종료 날짜가 필요합니다' });
    }

    const reservations = await Reservation.find({
      $or: [
        { startTime: { $gte: new Date(start), $lte: new Date(end) } },
        { endTime: { $gte: new Date(start), $lte: new Date(end) } },
        { $and: [
          { startTime: { $lte: new Date(start) } },
          { endTime: { $gte: new Date(end) } }
        ]}
      ]
    })
      .sort({ startTime: 1 })
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');
    
    res.json(reservations);
  } catch (error) {
    console.error('기간 예약 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 특정 예약 조회
router.get('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');
    
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error('예약 조회 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 예약 생성
router.post('/', [auth, [
  body('title').notEmpty().withMessage('제목을 입력하세요'),
  body('equipmentId').notEmpty().withMessage('장비를 선택하세요'),
  body('startTime').notEmpty().withMessage('시작 시간을 입력하세요'),
  body('endTime').notEmpty().withMessage('종료 시간을 입력하세요'),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, equipmentId, startTime, endTime } = req.body;
    const userId = req.user.id;

    // 시간 유효성 검사 (종료 시간이 시작 시간 이후인지)
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: '종료 시간은 시작 시간 이후여야 합니다' });
    }

    // 장비 존재 확인
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }

    // 예약 시간 중복 확인
    const overlap = await Reservation.checkOverlap(equipmentId, new Date(startTime), new Date(endTime));
    if (overlap) {
      return res.status(400).json({ message: '해당 시간에 이미 예약이 있습니다' });
    }

    const reservation = new Reservation({
      title,
      description,
      userId,
      equipmentId,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    await reservation.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');

    res.status(201).json(populatedReservation);
  } catch (error) {
    console.error('예약 생성 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 예약 수정
router.put('/:id', [auth, [
  body('title').notEmpty().withMessage('제목을 입력하세요'),
  body('equipmentId').notEmpty().withMessage('장비를 선택하세요'),
  body('startTime').notEmpty().withMessage('시작 시간을 입력하세요'),
  body('endTime').notEmpty().withMessage('종료 시간을 입력하세요'),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, equipmentId, startTime, endTime } = req.body;

    // 시간 유효성 검사
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: '종료 시간은 시작 시간 이후여야 합니다' });
    }

    // 기존 예약 확인
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }

    // 권한 확인 (본인 예약 또는 관리자만 수정 가능)
    if (reservation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    // 장비 존재 확인
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }

    // 예약 시간 중복 확인 (현재 예약 제외)
    const overlap = await Reservation.checkOverlap(
      equipmentId, 
      new Date(startTime), 
      new Date(endTime),
      req.params.id
    );
    
    if (overlap) {
      return res.status(400).json({ message: '해당 시간에 이미 예약이 있습니다' });
    }

    // 예약 수정
    reservation.title = title;
    reservation.description = description;
    reservation.equipmentId = equipmentId;
    reservation.startTime = new Date(startTime);
    reservation.endTime = new Date(endTime);

    await reservation.save();

    const updatedReservation = await Reservation.findById(reservation._id)
      .populate('userId', 'name email department')
      .populate('equipmentId', 'name color');

    res.json(updatedReservation);
  } catch (error) {
    console.error('예약 수정 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 예약 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }

    // 권한 확인 (본인 예약 또는 관리자만 삭제 가능)
    if (reservation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    await reservation.deleteOne();
    res.json({ message: '예약이 삭제되었습니다' });
  } catch (error) {
    console.error('예약 삭제 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 관리자용 모든 예약 삭제
router.delete('/admin/all', [auth, admin], async (req, res) => {
  try {
    await Reservation.deleteMany({});
    res.json({ message: '모든 예약이 삭제되었습니다' });
  } catch (error) {
    console.error('모든 예약 삭제 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

module.exports = router;
