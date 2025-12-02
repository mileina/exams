// backend/seeder-users.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté pour le seed'))
  .catch((err) => console.error('Erreur de connexion à MongoDB', err));

// Utilisateurs à insérer
const users = [
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123456',
    role: 'user'
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123456',
    role: 'admin'
  }
];

// Fonction pour insérer les utilisateurs
async function seedUsers() {
  try {
    // Supprimer les utilisateurs existants (optionnel)
    await User.deleteMany({});
    console.log('Utilisateurs existants supprimés');

    // Hasher les mots de passe et créer les utilisateurs
    for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = new User({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role
      });
      await newUser.save();
      console.log(`Utilisateur créé: ${user.username}`);
    }

    console.log('Utilisateurs insérés avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'insertion des utilisateurs', error);
    process.exit(1);
  }
}

seedUsers();
