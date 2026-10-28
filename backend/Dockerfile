FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

# On copie les 3 fichiers de l'application (les tests ne sont pas copiés)
COPY server.js app.js logic.js ./

EXPOSE 3000
# Contrôle de santé : Docker appelle /health dans le conteneur toutes les 10 s
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/health || exit 1
  
CMD ["node", "server.js"]