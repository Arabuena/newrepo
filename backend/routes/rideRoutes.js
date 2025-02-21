const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ride = require('../models/Ride');
const User = require('../models/User');

const {
  requestRide,
  acceptRide,
  completeRide,
  cancelRide,
  getNearbyDrivers,
  startRide
} = require('../controllers/rideController');

router.post('/request', auth, requestRide);
router.post('/accept/:rideId', auth, acceptRide);
router.post('/complete/:rideId', auth, completeRide);
router.post('/cancel/:rideId', auth, cancelRide);
router.get('/nearby-drivers', auth, getNearbyDrivers);
router.post('/start/:rideId', auth, startRide);

// Rota para buscar corridas disponíveis
router.get('/available', auth, async (req, res) => {
  try {
    // Verifica se é um motorista
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem buscar corridas' });
    }

    // Busca corridas pendentes
    const rides = await Ride.find({
      status: 'pending',
      driver: null
    })
    .populate('passenger', 'name phone')
    .select('-__v')
    .limit(1); // Pega apenas uma corrida por vez

    console.log('=== DEBUG CORRIDAS ===');
    console.log('Total de corridas encontradas:', rides.length);
    console.log('Usuário:', req.user.name);
    console.log('Role:', req.user.role);
    
    // Formata as corridas para o frontend
    const formattedRides = rides.map(ride => ({
      _id: ride._id,
      origin: {
        address: ride.origin.address,
        lat: ride.origin.coordinates[1],
        lng: ride.origin.coordinates[0]
      },
      destination: {
        address: ride.destination.address,
        lat: ride.destination.coordinates[1],
        lng: ride.destination.coordinates[0]
      },
      price: ride.price,
      distance: ride.distance,
      duration: ride.duration,
      passenger: {
        id: ride.passenger._id,
        name: ride.passenger.name,
        phone: ride.passenger.phone
      }
    }));

    console.log('Corridas formatadas:', formattedRides);
    console.log('=== FIM DEBUG ===\n');

    res.json(formattedRides);
  } catch (error) {
    console.error('Erro ao buscar corridas disponíveis:', error);
    res.status(500).json({ message: 'Erro ao buscar corridas disponíveis' });
  }
});

// Rota para verificar status da corrida
router.get('/status/:rideId', auth, async (req, res) => {
  try {
    const ride = await require('../models/Ride').findById(req.params.rideId)
      .populate('driver', 'name phone vehicle')
      .select('-__v');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar status da corrida' });
  }
});

module.exports = router; 