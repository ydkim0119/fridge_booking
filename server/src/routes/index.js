const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const equipmentRoutes = require('./equipment.routes');
const reservationRoutes = require('./reservation.routes');
const statsRoutes = require('./stats.routes');

// Setup routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/reservations', reservationRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
