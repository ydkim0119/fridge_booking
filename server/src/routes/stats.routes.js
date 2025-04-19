const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, subWeeks, subYears } = require('date-fns');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// 시간 범위 가져오기
const getTimeRange = (timeRange) => {
  const now = new Date();
  
  switch(timeRange) {
    case 'week':
      return {
        start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        end: endOfDay(now)
      };
    case 'year':
      return {
        start: startOfYear(subYears(now, 1)),
        end: endOfDay(now)
      };
    case 'month':
    default:
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfDay(now)
      };
  }
};

// 통계 데이터를 제공하는 메인 라우트
router.get('/', async (req, res) => {
  try {
    // 더미 통계 데이터 생성
    const timeRange = req.query.timeRange || 'month';
    
    const equipmentUsageData = [
      { name: '냉장고 1', usage: 24 },
      { name: '냉장고 2', usage: 18 },
      { name: '냉장고 3', usage: 32 },
      { name: '냉장고 4', usage: 15 },
      { name: '초저온냉장고', usage: 9 },
    ];
    
    const userUsageData = [
      { name: '김철수', usage: 12 },
      { name: '박영희', usage: 8 },
      { name: '이지훈', usage: 15 },
      { name: '정민지', usage: 7 },
      { name: '기타', usage: 10 },
    ];
    
    const timeDistributionData = [
      { name: '8-10시', usage: 15 },
      { name: '10-12시', usage: 22 },
      { name: '12-14시', usage: 18 },
      { name: '14-16시', usage: 25 },
      { name: '16-18시', usage: 20 },
      { name: '18-20시', usage: 12 },
    ];
    
    const weekdayUsageData = [
      { name: '일', usage: 8 },
      { name: '월', usage: 22 },
      { name: '화', usage: 25 },
      { name: '수', usage: 27 },
      { name: '목', usage: 20 },
      { name: '금', usage: 18 },
      { name: '토', usage: 10 },
    ];
    
    // 전체 통계 데이터 응답
    res.json({
      equipmentUsage: equipmentUsageData,
      userUsage: userUsageData,
      timeDistribution: timeDistributionData,
      weekdayUsage: weekdayUsageData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/equipment
// @desc    Get equipment usage statistics
// @access  Public
router.get('/equipment', async (req, res) => {
  try {
    // 더미 데이터 반환
    const equipmentStats = [
      { name: '냉장고 1', count: 12, hours: 36.5 },
      { name: '냉장고 2', count: 8, hours: 24.0 },
      { name: '냉장고 3', count: 15, hours: 45.5 },
      { name: '냉장고 4', count: 6, hours: 18.0 },
      { name: '초저온냉장고', count: 4, hours: 96.0 },
    ];
    
    res.json(equipmentStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/time
// @desc    Get usage statistics by hour
// @access  Public
router.get('/time', async (req, res) => {
  try {
    // 더미 데이터 반환
    const timeStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 10) + (i > 8 && i < 18 ? 5 : 0)
    }));
    
    res.json(timeStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/status
// @desc    Get reservation statistics by status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    // 더미 데이터 반환
    const statusStats = [
      { status: '승인됨', count: 35 },
      { status: '승인 대기중', count: 5 },
      { status: '거절됨', count: 2 },
      { status: '취소됨', count: 3 }
    ];
    
    res.json(statusStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/users
// @desc    Get reservation statistics by user
// @access  Public
router.get('/users', async (req, res) => {
  try {
    // 더미 데이터 반환
    const userStats = [
      { name: '김철수', count: 12 },
      { name: '박영희', count: 8 },
      { name: '이지훈', count: 15 },
      { name: '정민지', count: 7 },
      { name: '황동현', count: 6 },
      { name: '송미나', count: 5 },
      { name: '장기태', count: 4 },
      { name: '윤소라', count: 3 },
      { name: '최준호', count: 3 },
      { name: '임수정', count: 2 }
    ];
    
    res.json(userStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;