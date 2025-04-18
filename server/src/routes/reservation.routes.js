const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const { protect, admin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // 필터링 옵션
    if (req.query.equipmentId) {
      query.equipmentId = req.query.equipmentId;
    }
    
    // 관리자가 아닌 경우 자신의 예약만 볼 수 있음
    if (req.query.userId) {
      // 관리자만 다른 사용자의 예약을 볼 수 있음
      if (req.user.role !== 'admin' && req.query.userId !== req.user._id.toString()) {
        return res.status(403).json({ message: '다른 사용자의 예약을 조회할 권한이 없습니다' });
      }
      query.userId = req.query.userId;
    } else if (req.user.role !== 'admin') {
      // 관리자가 아니면 자신의 예약만
      query.userId = req.user._id;
    }

    const reservations = await Reservation.find(query)
      .sort({ startTime: 1 })
      .populate('userId', 'name username')
      .populate('equipmentId', 'name');
    
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/reservations/my
// @desc    Get logged in user's reservations
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .sort({ startTime: 1 })
      .populate('equipmentId', 'name');
    
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/reservations/upcoming
// @desc    Get upcoming reservations (next 24 hours)
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    let query = {
      startTime: { $gte: now, $lte: next24Hours },
      status: 'approved'
    };
    
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    
    const reservations = await Reservation.find(query)
      .sort({ startTime: 1 })
      .populate('userId', 'name username')
      .populate('equipmentId', 'name');
    
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   POST /api/reservations
// @desc    Create a new reservation
// @access  Private
router.post('/', [
  protect,
  body('equipmentId').not().isEmpty().withMessage('장비를 선택해주세요'),
  body('startTime').not().isEmpty().withMessage('시작 시간을 입력해주세요'),
  body('endTime').not().isEmpty().withMessage('종료 시간을 입력해주세요'),
  body('purpose').not().isEmpty().withMessage('사용 목적을 입력해주세요')
], validateRequest, async (req, res) => {
  try {
    const { equipmentId, startTime, endTime, purpose } = req.body;
    
    // 장비 유효성 확인
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }
    
    // 장비 사용 가능 여부 확인
    if (!equipment.isAvailable) {
      return res.status(400).json({ message: '현재 사용할 수 없는 장비입니다' });
    }
    
    // 시간 유효성 확인
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    
    if (start >= end) {
      return res.status(400).json({ message: '종료 시간은 시작 시간 이후여야 합니다' });
    }
    
    if (start < now) {
      return res.status(400).json({ message: '과거 시간에는 예약할 수 없습니다' });
    }
    
    // 시간 중복 확인
    const overlappingReservation = await Reservation.checkOverlap(equipmentId, start, end);
    if (overlappingReservation) {
      return res.status(400).json({ message: '해당 시간에는 이미 예약이 존재합니다' });
    }
    
    // 새 예약 생성
    const reservation = await Reservation.create({
      userId: req.user._id,
      equipmentId,
      startTime: start,
      endTime: end,
      purpose,
      status: 'approved' // 기본적으로 승인됨으로 설정
    });
    
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('userId', 'name username')
      .populate('equipmentId', 'name');
    
    res.status(201).json(populatedReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/reservations/:id
// @desc    Get reservation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'name username')
      .populate('equipmentId', 'name');
    
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    
    // 자신의 예약이거나 관리자만 조회 가능
    if (req.user.role !== 'admin' && reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '다른 사용자의 예약을 조회할 권한이 없습니다' });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   PUT /api/reservations/:id
// @desc    Update reservation
// @access  Private (owner or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    
    // 자신의 예약이거나 관리자만 수정 가능
    if (req.user.role !== 'admin' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '다른 사용자의 예약을 수정할 권한이 없습니다' });
    }
    
    // 시간 변경이 있는 경우
    if (req.body.startTime || req.body.endTime || req.body.equipmentId) {
      const equipmentId = req.body.equipmentId || reservation.equipmentId;
      const startTime = req.body.startTime ? new Date(req.body.startTime) : reservation.startTime;
      const endTime = req.body.endTime ? new Date(req.body.endTime) : reservation.endTime;
      const now = new Date();
      
      // 장비 유효성 확인
      if (req.body.equipmentId) {
        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) {
          return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
        }
        
        // 장비 사용 가능 여부 확인
        if (!equipment.isAvailable) {
          return res.status(400).json({ message: '현재 사용할 수 없는 장비입니다' });
        }
      }
      
      // 시간 유효성 확인
      if (startTime >= endTime) {
        return res.status(400).json({ message: '종료 시간은 시작 시간 이후여야 합니다' });
      }
      
      if (startTime < now) {
        return res.status(400).json({ message: '과거 시간으로 변경할 수 없습니다' });
      }
      
      // 시간 중복 확인 (자기 자신 제외)
      const overlappingReservation = await Reservation.checkOverlap(equipmentId, startTime, endTime, reservation._id);
      if (overlappingReservation) {
        return res.status(400).json({ message: '해당 시간에는 이미 예약이 존재합니다' });
      }
      
      // 업데이트할 필드
      if (req.body.equipmentId) reservation.equipmentId = equipmentId;
      if (req.body.startTime) reservation.startTime = startTime;
      if (req.body.endTime) reservation.endTime = endTime;
    }
    
    // 기타 필드 업데이트
    if (req.body.purpose) reservation.purpose = req.body.purpose;
    if (req.body.status && req.user.role === 'admin') reservation.status = req.body.status;
    
    const updatedReservation = await reservation.save();
    
    const populatedReservation = await Reservation.findById(updatedReservation._id)
      .populate('userId', 'name username')
      .populate('equipmentId', 'name');
    
    res.json(populatedReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   PUT /api/reservations/:id/status
// @desc    Update reservation status
// @access  Admin only
router.put('/:id/status', [protect, admin], async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    
    // 상태 변경
    if (['pending', 'approved', 'rejected', 'canceled'].includes(req.body.status)) {
      reservation.status = req.body.status;
      const updatedReservation = await reservation.save();
      
      const populatedReservation = await Reservation.findById(updatedReservation._id)
        .populate('userId', 'name username')
        .populate('equipmentId', 'name');
      
      res.json(populatedReservation);
    } else {
      return res.status(400).json({ message: '유효하지 않은 상태입니다' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete reservation
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }
    
    // 자신의 예약이거나 관리자만 삭제 가능
    if (req.user.role !== 'admin' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '다른 사용자의 예약을 삭제할 권한이 없습니다' });
    }
    
    await reservation.deleteOne();
    
    res.json({ message: '예약이 삭제되었습니다' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
