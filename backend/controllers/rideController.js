const Ride = require('../models/Ride');
const User = require('../models/User');

exports.requestRide = async (req, res) => {
  try {
    const {
      origin,
      destination,
      distance,
      duration
    } = req.body;

    // Validações
    if (distance > 100000) { // 100km em metros
      return res.status(400).json({ 
        message: 'Distância muito longa. Máximo permitido: 100km' 
      });
    }

    if (duration > 7200) { // 2 horas em segundos
      return res.status(400).json({ 
        message: 'Tempo de viagem muito longo. Máximo permitido: 2 horas' 
      });
    }

    console.log('=== DEBUG NOVA CORRIDA ===');
    console.log('Usuário:', req.user);
    console.log('Dados recebidos:', {
      origin,
      destination,
      distance,
      duration
    });

    // Calcula o preço
    const basePrice = 2;
    const pricePerKm = 2;
    const pricePerMin = 0.25;
    
    const distancePrice = (distance / 1000) * pricePerKm;
    const durationPrice = (duration / 60) * pricePerMin;
    const totalPrice = basePrice + distancePrice + durationPrice;

    // Cria a corrida
    const ride = new Ride({
      passenger: req.user.id,
      origin: {
        type: 'Point',
        coordinates: [origin.lng, origin.lat],
        address: origin.address
      },
      destination: {
        type: 'Point',
        coordinates: [destination.lng, destination.lat],
        address: destination.address
      },
      price: Math.round(totalPrice * 100) / 100,
      distance: Math.round(distance),
      duration: Math.round(duration),
      status: 'pending'
    });

    await ride.save();
    console.log('Corrida salva:', ride);
    console.log('=== FIM DEBUG ===');

    res.status(201).json(ride);
  } catch (error) {
    console.error('Erro ao criar corrida:', error);
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
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.rideId,
        status: 'pending'
      },
      {
        driver: req.user.id,
        status: 'accepted'
      },
      { new: true }
    ).populate('passenger', 'name phone')
      .populate('driver', 'name phone vehicle');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada ou já aceita' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    res.status(500).json({ message: 'Erro ao aceitar corrida' });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'in_progress') {
      return res.status(400).json({ message: 'Corrida precisa estar em andamento para ser finalizada' });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o motorista designado pode finalizar a corrida' });
    }

    // Atualiza o status e horário de término
    ride.status = 'completed';
    ride.endTime = new Date();
    await ride.save();

    // Garante que o motorista fique disponível novamente
    await User.findByIdAndUpdate(req.user.id, { 
      isAvailable: true,
      $unset: { currentRide: 1 } // Remove referência à corrida atual se existir
    });

    res.json({ 
      ...ride.toObject(),
      message: 'Corrida finalizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao finalizar corrida:', error);
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

exports.startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ 
        message: 'Corrida precisa estar aceita para ser iniciada' 
      });
    }

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Apenas o motorista designado pode iniciar a corrida' });
    }

    ride.status = 'in_progress';
    ride.startTime = new Date();
    await ride.save();

    // Popula os dados necessários
    await ride.populate('passenger', 'name phone');
    await ride.populate('driver', 'name phone vehicle location');

    res.json(ride);
  } catch (error) {
    console.error('Erro ao iniciar corrida:', error);
    res.status(500).json({ message: 'Erro ao iniciar corrida' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { location } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.driver.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Atualiza localização do motorista
    await User.findByIdAndUpdate(req.user.id, {
      'location.coordinates': location.coordinates
    });

    res.json({ message: 'Localização atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ message: 'Erro ao atualizar localização' });
  }
};

exports.getRideStatus = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('driver', 'name phone vehicle')
      .populate('passenger', 'name phone')
      .select('-__v');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar status da corrida:', error);
    res.status(500).json({ message: 'Erro ao buscar status da corrida' });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    // Verifica se é um motorista
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem buscar corridas' });
    }

    // Verifica se o motorista está disponível
    const driver = await User.findById(req.user.id);
    if (!driver.isAvailable) {
      return res.json([]);
    }

    console.log('Buscando corridas para motorista:', {
      driverId: req.user.id,
      isAvailable: driver.isAvailable,
      location: driver.location
    });

    // Busca corridas pendentes próximas ao motorista
    const rides = await Ride.find({
      status: 'pending',
      driver: null,
      'origin.coordinates': {
        $near: {
          $geometry: driver.location,
          $maxDistance: 10000 // 10km
        }
      }
    })
    .populate('passenger', 'name phone')
    .select('-__v')
    .limit(1);

    console.log('Corridas encontradas:', rides);

    res.json(rides);
  } catch (error) {
    console.error('Erro ao buscar corridas:', error);
    res.status(500).json({ message: 'Erro ao buscar corridas' });
  }
};

exports.getCurrentRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      $or: [
        { driver: req.user.id, status: { $in: ['accepted', 'in_progress'] } },
        { passenger: req.user.id, status: { $in: ['accepted', 'in_progress'] } }
      ]
    }).populate('passenger', 'name phone')
      .populate('driver', 'name phone vehicle');

    if (!ride) {
      return res.json(null);
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar corrida atual:', error);
    res.status(500).json({ message: 'Erro ao buscar corrida atual' });
  }
}; 