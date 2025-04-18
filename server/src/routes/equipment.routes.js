const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const { protect, admin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const equipment = await Equipment.find({});
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Admin only
router.post('/', [
  protect,
  admin,
  body('name').not().isEmpty().withMessage('장비명을 입력해주세요')
], validateRequest, async (req, res) => {
  try {
    const { name, description, isAvailable } = req.body;

    const equipment = await Equipment.create({
      name,
      description,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    res.status(201).json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Admin only
router.put('/:id', [protect, admin], async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }
    
    // 업데이트할 필드
    if (req.body.name !== undefined) equipment.name = req.body.name;
    if (req.body.description !== undefined) equipment.description = req.body.description;
    if (req.body.isAvailable !== undefined) equipment.isAvailable = req.body.isAvailable;
    
    const updatedEquipment = await equipment.save();
    res.json(updatedEquipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Admin only
router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: '장비를 찾을 수 없습니다' });
    }
    
    // 관련된 예약 모두 삭제
    await Reservation.deleteMany({ equipmentId: equipment._id });
    
    // 장비 삭제
    await equipment.deleteOne();
    
    res.json({ message: '장비가 삭제되었습니다' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
