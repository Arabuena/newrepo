const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, role, vehicle, documents } = req.body;

    // Verifica se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria o usuário
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      ...(role === 'driver' && { 
        vehicle,
        documents,
        isApproved: false // Motoristas precisam ser aprovados
      })
    });

    await user.save();

    // Gera o token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove a senha do objeto de resposta
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentativa de login:', { email });

    // Busca o usuário
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    console.log('Usuário encontrado:', { email, role: user.role });

    // Verifica a senha
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Senha válida:', validPassword);
    
    if (!validPassword) {
      console.log('Senha inválida para:', email);
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    console.log('Login successful:', { email, role: user.role }); // Debug

    // Verifica se o motorista está aprovado
    if (user.role === 'driver' && !user.isApproved) {
      return res.status(403).json({ 
        message: 'Sua conta ainda está em análise. Aguarde a aprovação.' 
      });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
}; 