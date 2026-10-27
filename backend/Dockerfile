FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

# On copie les 3 fichiers de l'application (les tests ne sont pas copiés)
COPY server.js app.js logic.js ./

EXPOSE 3000

CMD ["node", "server.js"]