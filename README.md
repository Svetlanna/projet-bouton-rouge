# Le Bouton Rouge 

Une petite application web volontairement inutile, créée pour apprendre Docker, les tests automatiques et la CI/CD

Après connexion, un gros bouton rouge dit « NE PAS APPUYER ». Chaque clic affiche un message de plus en plus catastrophique, jusqu'au 30e clic qui « détruit Internet » 💥

Identifiants de démonstration `admin` / `docker`

---

## Sommaire

1. [Comment fonctionne l'application](#1-comment-fonctionne-lapplication)
2. [Structure du projet](#2-structure-du-projet)
3. [Lancer le projet en local](#3-lancer-le-projet-en-local)
4. [Les tests](#4-les-tests)
5. [La CI/CD](#5-la-cicd)
6. [Le déploiement sur la VM](#6-le-déploiement-sur-la-vm)
7. [Les secrets GitHub](#7-les-secrets-github)
8. [Les ports](#8-les-ports)
9. [Problèmes fréquents et solutions](#9-problèmes-fréquents-et-solutions)
10. [Petit lexique](#10-petit-lexique)

---

## 1. Comment fonctionne l'application

L'application est découpée en deux parties, chacune dans son propre conteneur Docker

| Partie | Rôle | Technologie |
|---|---|---|
| Frontend | La page affichée dans le navigateur (formulaire, bouton, barre de progression) | Angular, servi par Nginx |
| Backend | Vérifie les identifiants et renvoie le message de chaque clic | Node.js avec Express |

Le navigateur ne parle jamais directement au backend. Toutes les demandes passent par Nginx, qui les relaie au backend à l'intérieur du réseau privé de Docker

```
 Navigateur
     │   http://<adresse-de-la-vm>:4203
     ▼
┌──────────────────── VM ─────────────────────┐
│  frontend (Nginx)                           │
│    ├── /        → page Angular              │
│    └── /api/... → http://backend:3000/      │
│                         │  réseau Docker    │
│                         ▼                   │
│                  backend (Express) :3000    │
└─────────────────────────────────────────────┘
```

Le backend propose deux routes

| Route | Envoi | Réponse |
|---|---|---|
| `POST /login` | `{ "username", "password" }` | `200` si les identifiants sont bons, sinon `401` |
| `POST /click` | `{ "count" }` entre 1 et 30 | le message du clic, sinon `400` |

---

## 2. Structure du projet

```
projet-bouton-rouge/
├── .github/workflows/ci.yml   ← la CI/CD (tests, images, déploiement)
├── compose.yaml               ← lance le projet sur un PC (construit les images)
├── compose.prod.yaml          ← lance le projet sur la VM (télécharge les images)
├── EXERCICES_BONUS_DOCKER.md  ← exercices pour s'entraîner avec Docker
├── README.md                  ← ce fichier
├── backend/
│   ├── Dockerfile             ← recette de l'image du backend
│   ├── package.json           ← dépendances et commandes npm
│   ├── logic.js               ← la logique (identifiants, messages) en fonctions pures
│   ├── app.js                 ← les routes Express, sans démarrer le serveur
│   ├── server.js              ← démarre le serveur sur le port 3000
│   ├── tests/
│   │   ├── logic.test.js      ← tests unitaires
│   │   └── api.test.js        ← tests d'intégration
│   └── scripts/
│       └── server_test.js     ← test smoke sur un vrai serveur
└── frontend/
    ├── Dockerfile             ← construit Angular puis le sert avec Nginx
    ├── nginx.conf             ← relaie /api/ vers le backend
    ├── proxy.conf.json        ← même rôle, en mode développement
    └── src/                   ← le code Angular
```

Pourquoi le backend est découpé en trois fichiers

- `logic.js` contient des fonctions pures, faciles à tester seules
- `app.js` contient les routes, testables sans ouvrir de vrai port réseau
- `server.js` ne fait que démarrer l'application

---

## 3. Lancer le projet en local

### Avec Docker (recommandé)

Prérequis, avoir Docker Desktop installé et lancé (baleine verte)

```powershell
cd C:\python-projs\projet-bouton-rouge
docker compose up --build -d     # construit et lance les 2 conteneurs
docker compose ps                # vérifie qu'ils tournent
```

Ouvrir http://localhost:8080 dans le navigateur

Pour tout arrêter

```powershell
docker compose down
```

### Sans Docker

Prérequis, avoir Node.js 22 installé. Il faut deux terminaux

Terminal 1, le backend

```powershell
cd backend
npm install
npm start
```

Terminal 2, le frontend

```powershell
cd frontend
npm install
npm start
```

Ouvrir http://localhost:4200 dans le navigateur

---

## 4. Les tests

Toutes les commandes se lancent dans le dossier `backend`

| Type | Fichier | Ce qu'il vérifie | Serveur lancé nécessaire |
|---|---|---|---|
| Unitaire | `tests/logic.test.js` | chaque fonction de `logic.js` toute seule | non |
| Intégration | `tests/api.test.js` | les routes HTTP avec un faux serveur (supertest) | non |
| Smoke | `scripts/server_test.js` | un vrai serveur démarré, par le réseau | oui |

### Lancer les tests unitaires et d'intégration

```powershell
cd backend
npm test
```

Résultat attendu

```
Tests:       24 passed, 24 total
```

### Lancer le test smoke

Dans un premier terminal, démarrer le serveur avec `npm start`, puis dans un second terminal

```powershell
cd backend
npm run test:smoke
```

Résultat attendu

```
  ✓ POST /login avec admin/docker répond 200
  ✓ POST /login avec de mauvais identifiants répond 401
  ✓ POST /click count=30 termine la partie
  ✓ POST /click count=31 répond 400

Tout est OK
```

Le test smoke peut viser une autre adresse grâce à la variable `BASE_URL`, par exemple l'application lancée avec Docker

```powershell
$env:BASE_URL="http://localhost:8080/api"; npm run test:smoke
```

Le fichier du test smoke est volontairement dans `scripts/` et non dans `tests/`, sinon Jest essaierait de le lancer sans serveur démarré

---

## 5. La CI/CD

- La CI (intégration continue) vérifie automatiquement le code à chaque `git push`
- Le CD (déploiement continu) met automatiquement la nouvelle version en ligne si la vérification réussit

Tout est décrit dans `.github/workflows/ci.yml`, et se voit dans l'onglet Actions du dépôt GitHub

```
git push
   │
   ▼
① Backend (Express)                  tests Jest + test smoke
   │  seulement si ① réussit
   ▼
② Construire et publier les images   construit les 2 images et les envoie sur Docker Hub
   │  seulement si ② réussit
   ▼
③ Déployer sur la VM                 copie compose.prod.yaml, télécharge les images,
                                     relance les conteneurs, puis test smoke en ligne
```

Points importants

- Le mot-clé `needs` fait attendre chaque tâche que la précédente ait réussi. Si un test échoue, rien n'est déployé et le site en ligne reste intact
- Les tâches ② et ③ ne se lancent que pour un vrai `push` sur `main`, pas pour une pull request
- Chaque image reçoit deux étiquettes, `latest` et le numéro du commit, ce qui permet de revenir à une ancienne version

---

## 6. Le déploiement sur la VM

### Pourquoi deux fichiers compose

| Fichier | Utilisé sur | Ce qu'il fait |
|---|---|---|
| `compose.yaml` | un PC | construit les images à partir du code (`build`) |
| `compose.prod.yaml` | la VM | télécharge les images prêtes depuis Docker Hub (`image`) |

La VM n'a pas besoin du code source, seulement de `compose.prod.yaml`

### Ce que fait la tâche de déploiement

```bash
cd ~/bouton-rouge-svetlana
docker compose -f compose.prod.yaml pull     # télécharge les nouvelles images
docker compose -f compose.prod.yaml up -d    # remplace les conteneurs
docker image prune -f                        # supprime les anciennes images
docker compose -f compose.prod.yaml ps       # affiche l'état
```

### Règle importante

Le fichier `compose.prod.yaml` du dépôt Git est la seule source de vérité. Toute modification faite à la main sur la VM est écrasée au déploiement suivant. Pour changer quelque chose, il faut modifier le fichier sur le PC puis faire un `git push`

### Vérifier le déploiement sur la VM

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep svetlana
curl -s http://localhost:4203 | head -1
```

Résultat attendu, deux conteneurs `Up`, le frontend avec `0.0.0.0:4203->80/tcp`, et une page HTML qui commence par `<!doctype html>`

---

## 7. Les secrets GitHub

Les accès ne sont jamais écrits dans le code. Ils sont enregistrés dans GitHub, dans Settings → Secrets and variables → Actions → onglet Secrets

| Nom du secret | Contenu attendu |
|---|---|
| `DOCKERHUB_USERNAME` | l'identifiant Docker Hub (pas l'adresse e-mail) |
| `DOCKERHUB_TOKEN` | un token Docker Hub avec la permission Read & Write |
| `VM_HOST` | l'adresse IP de la VM |
| `VM_USER` | l'utilisateur SSH de la VM |
| `VM_PASSWORD` | le mot de passe SSH de la VM |

À savoir

- Un secret n'est plus jamais lisible après son enregistrement, et il apparaît sous la forme `***` dans les journaux
- Un secret doit être créé dans l'onglet Secrets de la partie Actions, pas dans Variables, Codespaces ou Dependabot
- Aucun espace ni retour à la ligne ne doit être ajouté avant ou après la valeur
- Le token Docker Hub se crée dans Account settings → Personal access tokens, et il ne s'affiche qu'une seule fois
- Pour plus de sécurité, la connexion par mot de passe peut être remplacée par une clé SSH (secret `VM_SSH_KEY` et `key` au lieu de `password` dans `ci.yml`)

---

## 8. Les ports

Dans `"4203:80"`, le nombre de gauche est le port sur la machine, celui de droite est le port dans le conteneur

| Où | Port | Rôle |
|---|---|---|
| PC, frontend | `8080` | http://localhost:8080 |
| PC, backend | `3000` | utile pour tester l'API directement |
| VM, frontend | `4203` | la seule porte d'entrée pour les visiteurs |
| VM, backend | aucun | caché, seul Nginx lui parle par le réseau Docker |
| Dans les conteneurs | `80` (Nginx) et `3000` (Express) | ne changent jamais |

Sur la VM, plusieurs personnes déploient leurs projets. Chaque application doit donc utiliser un port différent, et ce port doit être ouvert dans le pare-feu Azure de la VM

Pour changer de port, il faut modifier deux endroits puis faire un `git push`

- `compose.prod.yaml`, la ligne `- "NOUVEAU_PORT:80"`
- `ci.yml`, la ligne `BASE_URL` du test smoke en ligne

---

## 9. Problèmes fréquents et solutions

| Message d'erreur | Cause | Solution |
|---|---|---|
| `failed to connect to the docker API at npipe` | Docker Desktop n'est pas lancé | lancer Docker Desktop et attendre la baleine verte |
| `additional properties 'frontend' not allowed` | mauvaise indentation dans le fichier compose | `frontend` doit être aligné avec `backend`, uniquement avec des espaces |
| `Missing script: "test"` | commande lancée hors du dossier `backend`, ou script absent | se placer dans `backend` et vérifier `package.json` |
| `Cannot find module '../backend/logic'` | mauvais chemin dans un test | depuis `backend/tests`, écrire `require("../logic")` |
| `Username required` | secret absent ou mal placé | le créer dans Settings → Secrets and variables → Actions → Secrets |
| `insufficient scopes` | token Docker Hub en lecture seule | créer un token Read & Write et mettre à jour le secret |
| `missing server host` | secret `VM_HOST` absent | le créer avec l'adresse IP de la VM |
| `ssh: unable to authenticate` | utilisateur ou mot de passe faux | retaper les secrets à la main, sans espace ni retour à la ligne |
| `Le serveur ne répond pas sur http://***:PORT/api` | port fermé dans le pare-feu Azure, ou mauvais port | vérifier sur la VM avec `curl localhost:PORT`, puis demander l'ouverture du port |
| Le conteneur frontend n'affiche aucun port | il redémarre en boucle, souvent parce que le port est déjà pris | choisir un port libre et regarder `docker compose logs frontend` |
| `Select-String: command not found` | commande PowerShell tapée sur la VM Linux | utiliser `grep` sur la VM |

Astuce, l'invite du terminal indique toujours où l'on se trouve

- `PS C:\...>` correspond au PC Windows
- `utilisateur@machine:~$` correspond à la VM Linux

---

## 10. Petit lexique

| Mot | Explication simple |
|---|---|
| Image Docker | un paquet figé qui contient un programme et tout ce dont il a besoin |
| Conteneur | une image en train de tourner |
| Docker Compose | un outil qui lance plusieurs conteneurs ensemble à partir d'un fichier |
| Registre (Docker Hub) | un entrepôt d'images sur Internet, comme GitHub pour le code |
| Tag | l'étiquette d'une image, par exemple `latest` |
| Port | un numéro de porte sur une machine |
| Nginx | un serveur web qui envoie la page et relaie les appels vers le backend |
| Test unitaire | vérifie une fonction toute seule |
| Test d'intégration | vérifie plusieurs morceaux ensemble |
| Test smoke | vérifie rapidement qu'un vrai serveur démarré répond |
| CI | vérification automatique du code à chaque push |
| CD | mise en ligne automatique après une vérification réussie |
| Secret | une valeur cachée que la CI peut utiliser sans qu'elle apparaisse dans le code |
| SSH | connexion sécurisée à distance vers une machine |
| Pare-feu | filtre qui décide quels ports d'une machine sont accessibles depuis Internet |
