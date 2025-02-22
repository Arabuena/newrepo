const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Ride = require('../models/Ride');
const User = require('../models/User');

// Enviar mensagem
router.post('/', auth, async (req, res) => {
  try {
    const { rideId, receiverId, content } = req.body;

    console.log('Nova mensagem sendo criada:', {
      rideId,
      senderId: req.user.id,
      receiverId,
      content
    });

    const message = new Message({
      ride: rideId,
      sender: req.user.id,
      receiver: receiverId,
      content
    });

    await message.save();
    
    // Popula os dados do sender e receiver
    await message.populate('sender', '_id name');
    await message.populate('receiver', '_id name');

    console.log('Mensagem salva:', {
      id: message._id,
      sender: message.sender._id,
      receiver: message.receiver._id,
      content: message.content
    });

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

// Buscar mensagens não lidas
router.get('/unread', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      receiver: req.user.id,
      read: false
    })
    .populate('sender', '_id name')
    .populate('receiver', '_id name')
    .populate('ride')
    .sort('-createdAt');

    console.log('Mensagens não lidas encontradas:', {
      userId: req.user.id,
      messages: messages.map(msg => ({
        id: msg._id,
        sender: msg.sender._id,
        receiver: msg.receiver._id,
        content: msg.content
      }))
    });

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens não lidas:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Buscar mensagens do suporte
router.get('/support', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, supportChat: true },
        { receiver: req.user.id, supportChat: true }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort('createdAt');

    // Marca mensagens como lidas
    await Message.updateMany(
      {
        receiver: req.user.id,
        supportChat: true,
        read: false
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens do suporte:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem para o suporte
router.post('/support', auth, async (req, res) => {
  try {
    const { content } = req.body;

    // Encontra um admin disponível
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Suporte não disponível no momento' });
    }

    const message = new Message({
      sender: req.user.id,
      receiver: admin._id,
      content,
      supportChat: true
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Buscar todas as conversas de suporte (apenas para admin)
router.get('/support/conversations', auth, async (req, res) => {
  try {
    // Verifica se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Busca todas as mensagens de suporte agrupadas por usuário
    const conversations = await Message.aggregate([
      { $match: { supportChat: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$content" },
          createdAt: { $first: "$createdAt" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Popula os dados dos usuários
    const populatedConversations = await User.populate(conversations, {
      path: '_id',
      select: 'name'
    });

    const formattedConversations = populatedConversations.map(conv => ({
      userId: conv._id._id,
      userName: conv._id.name,
      lastMessage: conv.lastMessage
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ message: 'Erro ao buscar conversas' });
  }
});

// Buscar mensagens de suporte com um usuário específico (para admin)
router.get('/support/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const messages = await Message.find({
      supportChat: true,
      $or: [
        { sender: req.params.userId, receiver: req.user._id },
        { sender: req.user._id, receiver: req.params.userId }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort('createdAt');

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Responder a uma mensagem de suporte (para admin)
router.post('/support/reply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { userId, content } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: userId,
      content,
      supportChat: true
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro ao enviar resposta:', error);
    res.status(500).json({ message: 'Erro ao enviar resposta' });
  }
});

module.exports = router; 