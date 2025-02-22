const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Ride = require('../models/Ride');

// Enviar mensagem
router.post('/', auth, async (req, res) => {
  try {
    const { rideId, receiverId, content } = req.body;

    const message = new Message({
      ride: rideId,
      sender: req.user.id,
      receiver: receiverId,
      content
    });

    await message.save();
    
    // Popula os dados do sender e receiver
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Buscar mensagens de uma corrida
router.get('/ride/:rideId', auth, async (req, res) => {
  try {
    // Primeiro verifica se o usuário tem permissão para ver as mensagens desta corrida
    const ride = await Ride.findById(req.params.rideId)
      .populate('driver', 'name')
      .populate('passenger', 'name');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Verifica se o usuário é o motorista ou passageiro da corrida
    if (ride.passenger._id.toString() !== req.user.id && 
        (!ride.driver || ride.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Sem permissão para ver estas mensagens' });
    }

    // Busca todas as mensagens da corrida
    const messages = await Message.find({
      ride: req.params.rideId
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort('createdAt');

    // Marca as mensagens recebidas como lidas
    await Message.updateMany(
      {
        ride: req.params.rideId,
        receiver: req.user.id,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Marcar mensagem como lida
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      {
        _id: req.params.messageId,
        receiver: req.user.id
      },
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }

    res.json(message);
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ message: 'Erro ao atualizar mensagem' });
  }
});

module.exports = router; 