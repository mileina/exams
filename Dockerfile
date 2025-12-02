FROM node:22-alpine

WORKDIR /app

# Copier et installer le backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copier le code
COPY backend ./backend

# Exposer le port
EXPOSE 5000

# Lancer le backend
CMD ["node", "backend/server.js"]
