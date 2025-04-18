const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateRequest } = require('../middleware/validator');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .not().isEmpty().withMessage('아이디를 입력해주세요')
    .custom(async value => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error('이미 사용 중인 아이디입니다');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('name')
    .not().isEmpty().withMessage('이름을 입력해주세요'),
  body('email')
    .isEmail().withMessage('유효한 이메일 주소를 입력해주세요')
    .custom(async value => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('이미 사용 중인 이메일입니다');
      }
      return true;
    })
], validateRequest, async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // 첫 번째 사용자는 관리자로 설정
    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      username,
      password,
      name,
      email,
      role
    });

    if (user) {
      res.status(201).json({
        message: '회원가입이 완료되었습니다'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('username').not().isEmpty().withMessage('아이디를 입력해주세요'),
  body('password').not().isEmpty().withMessage('비밀번호를 입력해주세요')
], validateRequest, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
