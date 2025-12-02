// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();
const { logger } = require('../logger');

const connectDB = async () => {
    try {
        logger.info('Connexion MongoDB en cours', { mongoHost: process.env.MONGO_URI?.split('@').pop() });
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB connecté');
    } catch (err) {
        logger.error('Erreur MongoDB', { error: err });
        console.error('Erreur MongoDB', err);
        process.exit(1);
    }
};

module.exports = connectDB;
