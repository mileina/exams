// notifi/server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config()
const { logger, auditLogger, httpLogger } = require('./logger');
//console.log(`process evn is ${JSON.stringify(process.env)}`)

const app = express();
app.use(bodyParser.json());
app.use(httpLogger);

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Adresse Gmail
    pass: process.env.EMAIL_APPLICATION_PASSWORD, // Mot de passe spécifique à l'application
  },
});

// Route pour envoyer un email
app.post('/notify', async (req, res) => {
  const { to, subject, text } = req.body;

  //const { message } = req.body;
    //console.log(`Notification: ${text}`);
    //res.send('Notification envoyée mail');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    auditLogger.info('Email envoyé', { to, subject });
    return res.status(200).json({ message: 'Email envoyé avec succès.' });
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email', { error: error.message, to, subject });
    return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email.', error });
  }
});

// Lancer le service Notification
const PORT = process.env.NOTIFI_PORT || 4002;
app.listen(PORT, () => {
  logger.info(`Service de notification en écoute sur le port ${PORT}`);
});
