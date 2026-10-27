# Exercices bonus : Docker

Vous avez réussi à lancer **Le Bouton Rouge** avec Docker Compose ? Voici six défis pour mieux comprendre ce qui se passe derrière l'application.

**Point de départ :** placez-vous dans le dossier racine du projet, celui qui contient `compose.yaml`. Sauf indication contraire, les commandes sont à exécuter depuis ce dossier.

## Exercice 1 : Enquête sur les conteneurs

1. Affichez les conteneurs en cours d'exécution avec `docker compose ps`.
2. Repérez le frontend et le backend. Pour chacun, notez le nom du conteneur, l'image utilisée et les ports affichés.
3. Affichez les journaux de l'application avec `docker compose logs`.
4. Affichez uniquement les journaux du backend avec `docker compose logs backend`.

**Questions :** combien de conteneurs tournent ? Quelle différence voyez-vous entre une *image* et un *conteneur* ?

## Exercice 2 : Saboter puis réparer l'application

1. Ouvrez l'application dans votre navigateur et vérifiez qu'elle fonctionne.
2. Arrêtez uniquement le backend :

   ```bash
   docker compose stop backend
   ```

3. Actualisez l'application et essayez de vous connecter ou de cliquer sur le bouton si vous êtes déjà connecté.
4. Observez le comportement et, si besoin, les erreurs dans les outils de développement du navigateur (touche `F12`, onglet **Réseau**).
5. Redémarrez le backend avec `docker compose start backend`, puis réessayez.

**Questions :** pourquoi la page peut-elle encore s'afficher alors que certaines actions échouent ? Quel rôle joue chaque conteneur ?

## Exercice 3 : Changer le port d'accès

1. Ouvrez `compose.yaml`.
2. Dans le service `frontend`, remplacez le port publié `8080:80` par `9090:80`.
3. Appliquez la modification :

   ```bash
   docker compose up -d
   ```

4. Essayez d'accéder à l'application sur `http://localhost:9090`.
5. Vérifiez ce qui se passe sur l'ancienne adresse `http://localhost:8080`.

**Questions :** dans `9090:80`, quel port appartient à votre ordinateur ? Quel port appartient au conteneur ?

## Exercice 4 : Entrer dans un conteneur

1. Ouvrez un terminal **dans** le conteneur backend :

   ```bash
   docker compose exec backend sh
   ```

2. Affichez le répertoire courant avec `pwd`.
3. Listez les fichiers avec `ls`.
4. Vérifiez la version de Node.js avec `node --version`.
5. Quittez le conteneur avec `exit`.

**Questions :** êtes-vous dans le même environnement que votre ordinateur ? Pourquoi Node.js est-il disponible à l'intérieur du conteneur ?

## Exercice 5 : Modifier le code et reconstruire

1. Dans `backend/server.js`, remplacez le texte de l'un des premiers messages du bouton par une phrase de votre invention.
2. Relancez le service **sans reconstruire son image** :

   ```bash
   docker compose restart backend
   ```

3. Rechargez l'application et atteignez le clic concerné. Le nouveau message apparaît-il ?
4. Reconstruisez et redémarrez le backend :

   ```bash
   docker compose up -d --build backend
   ```

5. Rechargez l'application et vérifiez à nouveau le message.

**Questions :** pourquoi un simple redémarrage ne suffit-il pas ? Quelle est la différence entre le code sur votre ordinateur et le code inclus dans une image Docker ?

## Exercice 6 : Masquer le backend à votre ordinateur

1. Dans `compose.yaml`, supprimez **uniquement** la section `ports` du service `backend`. Ne supprimez pas le service lui-même.
2. Appliquez la modification :

   ```bash
   docker compose up -d
   ```

3. Vérifiez que le frontend reste accessible sur le port choisi à l'exercice 3.
4. Essayez d'accéder directement au backend depuis votre ordinateur avec :

   ```bash
   curl http://localhost:3000/login
   ```

   *Attention : cette commande utilise GET alors que `/login` attend POST. Si vous obtenez une réponse HTTP comme « Cannot GET /login », le backend est joignable. Si la connexion est refusée, il ne l'est pas depuis ce port.*

5. Vérifiez que la connexion depuis l'application Angular fonctionne toujours.

**Questions :** comment le frontend peut-il communiquer avec le backend si le port 3000 n'est plus publié sur votre ordinateur ? À quoi sert le nom de service `backend` dans le réseau Docker Compose ?

---

## Pour terminer

Remettez votre projet dans un état fonctionnel et vérifiez que l'application est accessible dans le navigateur.

**Question de réflexion :** votre application fonctionne maintenant sur votre ordinateur. Que faudrait-il changer pour qu'une personne située dans une autre ville puisse y accéder ?

