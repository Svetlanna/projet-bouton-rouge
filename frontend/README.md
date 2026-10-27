# Le bouton rouge : Frontend Angular

Application Angular standalone destinée au TP Docker. Backend Express attendu : `POST /login` et `POST /click`.

## Lancement en local

Démarrer le backend Express sur `http://localhost:3000`, puis :

```bash
npm install
npm start
```

Ouvrir `http://localhost:4200`. Le proxy Angular redirige `/api/login` vers `http://localhost:3000/login` et `/api/click` vers `http://localhost:3000/click`.

Identifiants de démonstration : `admin` / `docker`.

## Docker

Le Dockerfile est fourni. Pour le faire fonctionner dans Docker Compose, nommer le service backend **`backend`** et exposer le frontend sur le port **80** du conteneur (par exemple `8080:80`). Nginx relaie les appels `/api/` vers `http://backend:3000/`.

Le frontend n'inclut pas le backend. Le compteur est conservé en mémoire côté navigateur et réinitialisé par « Recommencer ».
