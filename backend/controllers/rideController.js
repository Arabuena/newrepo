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

    console.log('=== DEBUG NOVA CORRIDA ===');
    console.log('Dados recebidos:');
    console.log('Origem:', origin);
    console.log('Destino:', destination);
    console.log('Distância:', distance);
    console.log('Duração:', duration);

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

    console.log('\nCorrida criada:');
    console.log(ride);
    console.log('=== FIM DEBUG ===\n');

    res.status(201).json({
      ride,
      estimatedDrivers: await User.countDocuments({
        role: 'driver',
        isAvailable: true,
        isApproved: true
      })
    });
  } catch (error) {
    console.error('Erro ao solicitar corrida:', error);
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
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name phone');
    
    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Esta corrida não está mais disponível' });
    }

    // Atualiza a corrida com os dados do motorista
    ride.driver = req.user.id;
    ride.status = 'accepted';
    await ride.save();

    // Busca os dados completos do motorista
    const driver = await User.findById(req.user.id);

    // Retorna a corrida com todos os dados necessários
    const fullRide = await Ride.findById(ride._id)
      .populate('passenger', 'name phone')
      .populate('driver', 'name phone vehicle location');

    res.json(fullRide);
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

exports.startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name phone')
      .populate('driver', 'name phone vehicle location');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Corrida não pode ser iniciada' });
    }

    ride.status = 'in_progress';
    await ride.save();

    res.json(ride);
  } catch (error) {
    console.error('Erro ao iniciar corrida:', error);
    res.status(500).json({ message: 'Erro ao iniciar corrida' });
  }
}; 