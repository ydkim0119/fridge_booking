const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// GET all reservations
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'name email')
      .populate('equipment', 'name type location');
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET filtered reservations - 필터링 기능 개선 (일 단위 예약 지원)
router.get('/filter', async (req, res) => {
  try {
    const { userId, equipmentId, startDate, endDate } = req.query;
    
    // 필터 조건 구성
    const filterConditions = {};
    
    // 사용자 ID로 필터링 (클라이언트에서 userId로 전송)
    if (userId) {
      filterConditions.user = userId;
    }
    
    // 장비 ID로 필터링 (클라이언트에서 equipmentId로 전송)
    if (equipmentId) {
      filterConditions.equipment = equipmentId;
    }
    
    // 날짜 범위 필터링
    if (startDate || endDate) {
      // startDate와 endDate 필드로 검색 조건 설정
      if (startDate) {
        filterConditions.startDate = { $gte: new Date(startDate) };
      }
      
      if (endDate) {
        filterConditions.endDate = { $lte: new Date(endDate) };
      }
    }
    
    const reservations = await Reservation.find(filterConditions)
      .populate('user', 'name email')
      .populate('equipment', 'name type location')
      .sort({ startDate: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching filtered reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET reservations for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 사용자 예약 가져오기
    const reservations = await Reservation.find({ user: userId })
      .populate('equipment', 'name type location')
      .sort({ startDate: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET reservations for a specific equipment
router.get('/equipment/:equipmentId', async (req, res) => {
  try {
    const equipmentId = req.params.equipmentId;
    
    // 장비 예약 가져오기
    const reservations = await Reservation.find({ equipment: equipmentId })
      .populate('user', 'name email')
      .sort({ startDate: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching equipment reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'name email')
      .populate('equipment', 'name type location');
      
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create a new reservation (일 단위 예약)
router.post('/', async (req, res) => {
  try {
    const { title, equipment, startDate, endDate, notes, user } = req.body;
    
    // Basic validation
    if (!equipment || !startDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // 종료일이 제공되지 않은 경우 시작일 다음 날로 설정
    let reservationEndDate = endDate;
    if (!endDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      reservationEndDate = nextDay.toISOString().split('T')[0];
    }
    
    // 날짜 포맷 정규화: 시간 정보 제거하고 일 단위로만 저장
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(reservationEndDate);
    normalizedEndDate.setHours(0, 0, 0, 0);
    
    // 요청에서 사용자 ID 추출 또는 인증된 사용자 ID 사용
    const userId = user || req.user._id;
    
    // Create reservation
    const newReservation = new Reservation({
      title: title || `장비 예약`,
      user: userId,
      equipment,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      notes: notes || ''
    });
    
    const savedReservation = await newReservation.save();
    
    // Populate details for response
    const populatedReservation = await Reservation.findById(savedReservation._id)
      .populate('user', 'name email')
      .populate('equipment', 'name type location');
      
    res.status(201).json(populatedReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update a reservation (일 단위 예약)
router.put('/:id', async (req, res) => {
  try {
    const { title, equipment, startDate, endDate, notes, user } = req.body;
    const reservationId = req.params.id;
    
    // Verify reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Update fields
    if (title) reservation.title = title;
    if (equipment) reservation.equipment = equipment;
    if (user) reservation.user = user;
    
    // 날짜 정보 업데이트 (일 단위)
    if (startDate) {
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      reservation.startDate = normalizedStartDate;
    }
    
    if (endDate) {
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(0, 0, 0, 0);
      reservation.endDate = normalizedEndDate;
    } else if (startDate && !endDate) {
      // 종료일이 제공되지 않았지만 시작일이 변경된 경우, 종료일을 시작일 다음날로 설정
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      reservation.endDate = nextDay;
    }
    
    if (notes !== undefined) reservation.notes = notes;
    
    // Save updated reservation
    await reservation.save();
    
    // Populate details for response
    const updatedReservation = await Reservation.findById(reservationId)
      .populate('user', 'name email')
      .populate('equipment', 'name type location');
      
    res.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE a reservation
router.delete('/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    
    // Verify reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Delete the reservation
    await Reservation.findByIdAndDelete(reservationId);
    
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET reservations for a date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // 시간 정보 제거 (일 단위 비교)
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Get reservations in date range
    const reservations = await Reservation.find({
      // 시작일이 지정 범위 내에 있거나, 종료일이 지정 범위 내에 있는 예약 조회
      $or: [
        { 
          startDate: { $gte: start, $lte: end } 
        },
        { 
          endDate: { $gt: start, $lte: end } 
        },
        // 지정 범위를 완전히 포함하는 예약도 조회
        {
          startDate: { $lte: start },
          endDate: { $gte: end }
        }
      ]
    })
    .populate('user', 'name email')
    .populate('equipment', 'name type location')
    .sort({ startDate: 1 });
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservation range:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 날짜별 더미 데이터 제공 라우트 (API가 없을 때를 대비)
router.get('/dummy/dateRange', async (req, res) => {
  try {
    const startDate = new Date('2025-04-19');
    const endDate = new Date('2025-04-30');
    
    // 더미 사용자 데이터
    const users = [
      { _id: '1', name: '김철수' },
      { _id: '2', name: '박영희' },
      { _id: '3', name: '이지훈' },
      { _id: '4', name: '정민지' }
    ];
    
    // 더미 장비 데이터
    const equipmentList = [
      { _id: '1', name: '냉장고 1', color: '#3B82F6' },
      { _id: '2', name: '냉장고 2', color: '#10B981' },
      { _id: '3', name: '냉장고 3', color: '#F59E0B' },
      { _id: '4', name: '냉장고 4', color: '#EF4444' },
      { _id: '5', name: '초저온냉장고', color: '#8B5CF6' }
    ];
    
    // 더미 예약 데이터 생성 (일 단위)
    const dummyReservations = [
      {
        _id: '1',
        title: '시료 냉동 보관',
        user: { _id: '1', name: '김철수', email: 'user1@example.com' },
        equipment: { _id: '1', name: '냉장고 1', type: '일반', color: '#3B82F6' },
        startDate: '2025-04-19T00:00:00.000Z',
        endDate: '2025-04-20T00:00:00.000Z',
        notes: '분자생물학 실험 시료'
      },
      {
        _id: '2',
        title: '저온 실험',
        user: { _id: '2', name: '박영희', email: 'user2@example.com' },
        equipment: { _id: '3', name: '냉장고 3', type: '저온', color: '#F59E0B' },
        startDate: '2025-04-21T00:00:00.000Z',
        endDate: '2025-04-22T00:00:00.000Z',
        notes: '효소 활성도 실험'
      },
      {
        _id: '3',
        title: '초저온 보존',
        user: { _id: '3', name: '이지훈', email: 'user3@example.com' },
        equipment: { _id: '5', name: '초저온냉장고', type: '초저온', color: '#8B5CF6' },
        startDate: '2025-04-23T00:00:00.000Z',
        endDate: '2025-04-24T00:00:00.000Z',
        notes: '세포 보존'
      },
      {
        _id: '4',
        title: '시약 보관',
        user: { _id: '4', name: '정민지', email: 'user4@example.com' },
        equipment: { _id: '2', name: '냉장고 2', type: '시약용', color: '#10B981' },
        startDate: '2025-04-25T00:00:00.000Z',
        endDate: '2025-04-27T00:00:00.000Z', // 2일 예약
        notes: '화학 실험 시약'
      }
    ];
    
    res.json(dummyReservations);
  } catch (error) {
    console.error('Error providing dummy data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;