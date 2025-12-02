FROM node:22-alpine AS build

WORKDIR /app

# Copier et installer dépendances frontend
COPY frontend/package*.json ./
RUN npm install

# Copier le code source
COPY frontend ./

# Build React
RUN npm run build

# Étape 2 : Serveur de production
FROM node:22-alpine

WORKDIR /app

# Installer serve pour servir l'app
RUN npm install -g serve

# Copier le build depuis l'étape précédente
COPY --from=build /app/build ./build

# Exposer le port
EXPOSE 3000

# Lancer l'app
CMD ["serve", "-s", "build", "-l", "3000"]
