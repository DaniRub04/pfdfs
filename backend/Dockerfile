FROM node:20-alpine

WORKDIR /app

# Copiamos dependencias primero
COPY package*.json ./
RUN npm ci --omit=dev

# Copiamos todo el código
COPY . .

# Usuario no root (seguridad)
USER node

ENV NODE_ENV=production
EXPOSE 3000

# Arranque del backend
CMD ["npm", "start"]
