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

// @route   GET /api/stats/equipment
// @desc    Get equipment usage statistics
// @access  Private
router.get('/equipment', protect, async (req, res) => {
  try {
    const { start, end } = getTimeRange(req.query.timeRange);
    
    // 장비별 예약 수 가져오기
    const equipmentStats = await Reservation.aggregate([
      {
        $match: {
          startTime: { $gte: start },
          endTime: { $lte: end },
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'equipment',
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      {
        $unwind: '$equipment'
      },
      {
        $group: {
          _id: '$equipmentId',
          name: { $first: '$equipment.name' },
          count: { $sum: 1 },
          hours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                3600000 // 밀리초를 시간으로 변환 (1시간 = 3600000밀리초)
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          count: 1,
          hours: { $round: ['$hours', 1] }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json(equipmentStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/time
// @desc    Get usage statistics by hour
// @access  Private
router.get('/time', protect, async (req, res) => {
  try {
    const { start, end } = getTimeRange(req.query.timeRange);
    
    // 시간대별 예약 통계
    const timeStats = await Reservation.aggregate([
      {
        $match: {
          startTime: { $gte: start },
          endTime: { $lte: end },
          status: 'approved'
        }
      },
      {
        $project: {
          hour: { $hour: '$startTime' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          count: 1
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);
    
    // 빈 시간대 채우기 (0~23시 전부 표시)
    const allHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0
    }));
    
    // 실제 데이터로 비지 않은 시간대 채우기
    timeStats.forEach(stat => {
      const hourIndex = allHours.findIndex(h => h.hour === stat.hour);
      if (hourIndex !== -1) {
        allHours[hourIndex].count = stat.count;
      }
    });
    
    res.json(allHours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/status
// @desc    Get reservation statistics by status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const { start, end } = getTimeRange(req.query.timeRange);
    
    // 상태별 예약 통계
    const statusStats = await Reservation.aggregate([
      {
        $match: {
          startTime: { $gte: start },
          endTime: { $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'approved'] }, then: '승인됨' },
                { case: { $eq: ['$_id', 'pending'] }, then: '승인 대기중' },
                { case: { $eq: ['$_id', 'rejected'] }, then: '거절됨' },
                { case: { $eq: ['$_id', 'canceled'] }, then: '취소됨' }
              ],
              default: '기타'
            }
          },
          count: 1
        }
      }
    ]);
    
    res.json(statusStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/stats/users
// @desc    Get reservation statistics by user
// @access  Admin only
router.get('/users', [protect, admin], async (req, res) => {
  try {
    const { start, end } = getTimeRange(req.query.timeRange);
    
    // 사용자별 예약 통계 (상위 10명)
    const userStats = await Reservation.aggregate([
      {
        $match: {
          startTime: { $gte: start },
          endTime: { $lte: end },
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$userId',
          name: { $first: '$user.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json(userStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
