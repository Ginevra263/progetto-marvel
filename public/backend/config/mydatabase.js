const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    if (!config.MONGO_URI) {
      throw new Error('MONGO_URI non trovato nella configurazione');
    }

    console.log('Tentativo di connessione a:', config.MONGO_URI);

    await mongoose.connect(config.MONGO_URI);
    console.log('Database connesso con successo');
  } catch (error) {
    console.error('Errore di connessione al database:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;