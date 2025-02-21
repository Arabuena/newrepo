const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.patch('/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem atualizar localização' });
    }

    const user = await User.findById(req.user.id);
    user.location.coordinates = coordinates;
    await user.save();

    res.json({ message: 'Localização atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ message: 'Erro ao atualizar localização' });
  }
});

router.patch('/availability', auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem atualizar disponibilidade' });
    }

    const user = await User.findById(req.user.id);
    user.isAvailable = isAvailable;
    await user.save();

    res.json({ message: 'Disponibilidade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar disponibilidade' });
  }
});

module.exports = router; 