const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está definida nas variáveis de ambiente');
    }

    // Adicionar logs para debug
    console.log('Tentando conectar ao MongoDB...');
    console.log('URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Log seguro da URI

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB conectado com sucesso!');
  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Tentando reconectar em 5 segundos...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 