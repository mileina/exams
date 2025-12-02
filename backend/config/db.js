// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();
const { logger } = require('../logger');

const connectDB = async () => {
    try {
        logger.info('Connexion MongoDB en cours', { mongoHost: process.env.MONGO_URI?.split('@').pop() });
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('MongoDB connecté');
    } catch (err) {
        logger.error('Erreur MongoDB', { error: err.message });
        process.exit(1);
    }
};

module.exports = connectDB;
