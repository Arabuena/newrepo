const Ride = require('../models/Ride');
const User = require('../models/User');

exports.requestRide = async (req, res) => {
  try {
    const {
      originCoordinates,
      originAddress,
      destinationCoordinates,
      destinationAddress,
      price,
      distance,
      duration
    } = req.body;

    const ride = new Ride({
      passenger: req.user.id,
      origin: {
        coordinates: originCoordinates,
        address: originAddress
      },
      destination: {
        coordinates: destinationCoordinates,
        address: destinationAddress
      },
      price,
      distance,
      duration
    });

    await ride.save();

    // Aqui você pode implementar a lógica para notificar motoristas próximos
    
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar corrida' });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    const drivers = await User.find({
      role: 'driver',
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: 10000 // 10km em metros
        }
      }
    });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar motoristas próximos' });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    ride.driver = req.user.id;
    ride.status = 'accepted';
    await ride.save();

    // Aqui você pode implementar notificação ao passageiro

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aceitar corrida' });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    ride.status = 'completed';
    await ride.save();

    // Aqui você pode implementar lógica de pagamento e avaliação

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao finalizar corrida' });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Aqui você pode implementar notificação às partes envolvidas

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cancelar corrida' });
  }
}; 