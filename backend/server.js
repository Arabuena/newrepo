const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware para logs detalhados
app.use((req, res, next) => {
  const logInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  };
  
  console.log('Request:', JSON.stringify(logInfo, null, 2));
  
  // Capturar a resposta
  const oldSend = res.send;
  res.send = function(data) {
    console.log('Response:', {
      status: res.statusCode,
      data: data
    });
    return oldSend.apply(res, arguments);
  };
  
  next();
});

// Configurar CORS
const corsOptions = {
  origin: ['https://newrepo-woad-nine.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware para preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Barak Backend API',
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Conectar ao MongoDB
connectDB();

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Rota padrão para 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barak Backend rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`CORS Origin: ${corsOptions.origin}`);
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
}); 