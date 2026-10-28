FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/le-bouton-rouge-frontend/browser /usr/share/nginx/html
EXPOSE 80

# Contrôle de santé : Docker vérifie que Nginx renvoie la page d'accueil toutes les 10 s
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1