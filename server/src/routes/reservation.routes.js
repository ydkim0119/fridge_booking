const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// GET all reservations
router.get('/', protect, async (req, res) => {
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

// GET filtered reservations - 필터링 기능 개선
router.get('/filter', protect, async (req, res) => {
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
      const dateFilter = {};
      
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      
      // MongoDB에서 startTime 필드를 기준으로 필터링
      filterConditions.startTime = dateFilter;
    }
    
    const reservations = await Reservation.find(filterConditions)
      .populate('user', 'name email')
      .populate('equipment', 'name type location')
      .sort({ startTime: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching filtered reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET reservations for a specific user
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's reservations
    const reservations = await Reservation.find({ user: userId })
      .populate('equipment', 'name type location')
      .sort({ startTime: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET reservations for a specific equipment
router.get('/equipment/:equipmentId', protect, async (req, res) => {
  try {
    const equipmentId = req.params.equipmentId;
    
    // Verify equipment exists
    const equipmentExists = await Equipment.findById(equipmentId);
    if (!equipmentExists) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Get equipment reservations
    const reservations = await Reservation.find({ equipment: equipmentId })
      .populate('user', 'name email')
      .sort({ startTime: 1 });
      
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching equipment reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single reservation by ID
router.get('/:id', protect, async (req, res) => {
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

// POST create a new reservation
router.post('/', protect, async (req, res) => {
  try {
    const { title, equipment, date, startTime, endTime, notes } = req.body;
    
    // Basic validation
    if (!equipment || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Verify equipment exists
    const equipmentExists = await Equipment.findById(equipment);
    if (!equipmentExists) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Check for overlapping reservations
    const overlappingReservations = await Reservation.find({
      equipment,
      $or: [
        { 
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });
    
    if (overlappingReservations.length > 0) {
      return res.status(400).json({ 
        message: 'This time slot is already booked',
        conflicts: overlappingReservations
      });
    }
    
    // Create reservation
    const newReservation = new Reservation({
      title: title || `${equipmentExists.name} 예약`,
      user: req.user._id, // From auth middleware
      equipment,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
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

// PUT update a reservation
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, equipment, date, startTime, endTime, notes } = req.body;
    const reservationId = req.params.id;
    
    // Verify reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if user is authorized to update reservation
    if (reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this reservation' });
    }
    
    // If equipment or date/time is changing, check for conflicts
    if (
      (equipment && equipment !== reservation.equipment.toString()) ||
      (startTime && new Date(startTime).toISOString() !== new Date(reservation.startTime).toISOString()) ||
      (endTime && new Date(endTime).toISOString() !== new Date(reservation.endTime).toISOString())
    ) {
      // Check for overlapping reservations
      const overlappingReservations = await Reservation.find({
        _id: { $ne: reservationId }, // Exclude current reservation
        equipment: equipment || reservation.equipment,
        $or: [
          { 
            startTime: { $lt: endTime || reservation.endTime },
            endTime: { $gt: startTime || reservation.startTime }
          }
        ]
      });
      
      if (overlappingReservations.length > 0) {
        return res.status(400).json({ 
          message: 'This time slot is already booked',
          conflicts: overlappingReservations
        });
      }
    }
    
    // Update fields
    if (title) reservation.title = title;
    if (equipment) reservation.equipment = equipment;
    if (startTime) reservation.startTime = new Date(startTime);
    if (endTime) reservation.endTime = new Date(endTime);
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
router.delete('/:id', protect, async (req, res) => {
  try {
    const reservationId = req.params.id;
    
    // Verify reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if user is authorized to delete reservation
    if (reservation.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this reservation' });
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
router.get('/range/:startDate/:endDate', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Get reservations in date range
    const reservations = await Reservation.find({
      startTime: {
        $gte: start,
        $lte: end
      }
    })
    .populate('user', 'name email')
    .populate('equipment', 'name type location')
    .sort({ startTime: 1 });
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservation range:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;