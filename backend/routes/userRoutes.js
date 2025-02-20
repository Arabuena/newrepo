const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.patch('/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!req.user.role === 'driver') {
      return res.status(403).json({ message: 'Apenas motoristas podem atualizar localização' });
    }

    req.user.location.coordinates = coordinates;
    await req.user.save();

    res.json({ message: 'Localização atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar localização' });
  }
});

module.exports = router; 