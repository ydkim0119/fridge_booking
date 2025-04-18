const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// 모든 사용자 조회 (관리자 전용)
router.get('/', [protect, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('사용자 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 현재 로그인한 사용자 정보 조회
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.json(user);
  } catch (error) {
    console.error('사용자 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 특정 사용자 조회
router.get('/:id', protect, async (req, res) => {
  try {
    // 관리자가 아닌 경우, 자신의 정보만 조회 가능
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('사용자 조회 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 사용자 정보 수정
router.put('/:id', [protect, [
  body('name').notEmpty().withMessage('이름을 입력하세요'),
  body('department').notEmpty().withMessage('소속 부서를 입력하세요'),
  body('email').isEmail().withMessage('유효한 이메일을 입력하세요')
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // 자신의 정보만 수정 가능 (관리자 제외)
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    const { name, email, department } = req.body;

    // 이메일 중복 확인 (현재 사용자 제외)
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다' });
    }

    // 사용자 정보 업데이트
    const userFields = { name, email, department };
    
    // 비밀번호 변경 (있는 경우)
    if (req.body.password && req.body.password.length >= 6) {
      userFields.password = req.body.password;
    }
    
    // 관리자만 역할 변경 가능
    if (req.user.role === 'admin' && req.body.role) {
      userFields.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    res.json(user);
  } catch (error) {
    console.error('사용자 수정 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

// 사용자 삭제 (관리자 전용)
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    // 마지막 관리자는 삭제할 수 없음
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: '마지막 관리자는 삭제할 수 없습니다' });
      }
    }

    await user.deleteOne();
    res.json({ message: '사용자가 삭제되었습니다' });
  } catch (error) {
    console.error('사용자 삭제 에러:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
});

module.exports = router;
