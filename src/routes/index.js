const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const driverRoutes = require('./driver.routes');
const deliveriesRoutes = require('./delivery.routes');
const locationsRoutes = require('./location.routes');

router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/deliveries', deliveriesRoutes);
router.use('/locations', locationsRoutes);

module.exports = router;
