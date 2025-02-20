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

router.get('/available', async (req, res) => {
  try {
    // Simula uma corrida aleatória
    const mockRide = {
      _id: Math.random().toString(36).substr(2, 9),
      origin: {
        address: "Escola Municipal José Luiz Bittencourt",
        lat: -16.6799,
        lng: -49.2567
      },
      destination: {
        address: "Hospital Buriti",
        lat: -16.6820,
        lng: -49.2545
      },
      price: Math.floor(Math.random() * (50 - 15) + 15)
    };

    // 30% de chance de retornar uma corrida
    if (Math.random() < 0.3) {
      res.json([mockRide]);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 