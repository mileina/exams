// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // modèle utilisateur
require('dotenv').config();
const axios = require('axios');
const { logger, auditLogger } = require('../logger');
//const sendEmail = require('../services/emailService');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      auditLogger.warn('Tentative de connexion avec utilisateur inconnu', { username, ip: req.ip });
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      auditLogger.warn('Mot de passe incorrect', { username, ip: req.ip, userId: user._id.toString() });
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    auditLogger.info('Connexion réussie', { username, userId: user._id.toString(), role: user.role, ip: req.ip });
    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    logger.error('Erreur lors du login', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  try {
    // BUG #1 FIX: Validation des champs obligatoires
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires',
        errors: {
          username: !username ? 'Le nom d\'utilisateur est requis' : null,
          email: !email ? 'L\'email est requis' : null,
          password: !password ? 'Le mot de passe est requis' : null,
          confirmPassword: !confirmPassword ? 'La confirmation est requise' : null
        }
      });
    }

    // Validation longueur username
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        message: 'Le nom d\'utilisateur doit faire entre 3 et 30 caractères'
      });
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide'
      });
    }

    // Validation mot de passe force
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit faire au moins 8 caractères',
        hint: 'Incluez majuscules, minuscules, chiffres et caractères spéciaux'
      });
    }

    // Vérification confirmation password
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Vérifier si l'email ou le username existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      auditLogger.warn('Tentative d\'inscription sur email/username déjà utilisé', { email, username, ip: req.ip });
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Cet email est déjà utilisé' 
          : 'Ce nom d\'utilisateur existe déjà'
      });
    }

    // Créer un nouvel utilisateur
    const user = new User({ username, email, password });
    await user.save();

    auditLogger.info('Compte créé', { userId: user._id.toString(), username, email, ip: req.ip });

    // Envoyer un email de bienvenue
    // await sendEmail(
    //   email,
    //   'Bienvenue dans notre application',
    //   `Bonjour ${username},\n\nMerci de vous être inscrit. Nous sommes ravis de vous accueillir !`
    // );

    // await axios.post('http://localhost:4002/notify', {
    //   to: email,
    //   subject: 'Bienvenue dans notre application',
    //   text: `Bonjour ${username},\n\nMerci de vous être inscrit. Nous sommes ravis de vous accueillir !`,
    // });

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription', { error: error.message });
    res.status(500).json({ message: 'Une erreur est survenue.' });
  }
};
