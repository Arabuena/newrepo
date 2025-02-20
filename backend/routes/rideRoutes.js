const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  requestRide,
  acceptRide,
  completeRide,
  cancelRide,
  getNearbyDrivers
} = require('../controllers/rideController');

router.post('/request', auth, requestRide);
router.post('/accept/:rideId', auth, acceptRide);
router.post('/complete/:rideId', auth, completeRide);
router.post('/cancel/:rideId', auth, cancelRide);
router.get('/nearby-drivers', auth, getNearbyDrivers);

module.exports = router; 