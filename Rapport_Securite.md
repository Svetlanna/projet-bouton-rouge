## 1. Audit de sécurité — npm audit

### Résultat initial

L'audit du backend (Jest 30.5.2) signale **5 vulnérabilités de niveau faible (low)**. Elles proviennent toutes d'une seule bibliothèque, `deepmerge` (GHSA-gcqx-w48m-w2h4), utilisée indirectement par Jest (jest → @jest/core → jest-config → deepmerge)

### Tentative de correction avec `npm audit fix --force`

Pour corriger `deepmerge`, npm propose d'installer **Jest 25.1.0**, une version beaucoup plus ancienne (« breaking change »). Après cette commande, l'audit est passé à **29 vulnérabilités (2 critiques, 2 élevées, 23 modérées, 2 faibles)**, dues aux vieilles dépendances de Jest 25. Le changement a donc été **annulé** (`git checkout -- package.json package-lock.json`, puis `npm ci`) pour revenir à Jest 30.5.2

### Analyse

-   Les 5 vulnérabilités restantes concernent **uniquement les dépendances de développement** (Jest).
-   Jest n'est **pas installé dans l'image Docker** (`npm install --omit=dev` dans le Dockerfile).
-   Audit limité à la production : `npm audit --omit=dev` → **0 vulnérabilité** (backend et frontend).
-   Les tests passent toujours : **24/24**

### Décision

Les 5 vulnérabilités faibles sont **acceptées** elles ne touchent pas la production, et leur correction automatique dégrade la sécurité Elles seront corrigées lors d'une future version de Jest

### Mise en place dans la CI

Deux étapes ajoutées dans la tâche `backend` du workflow, avant l'installation et les tests `npm audit --omit=dev --audit-level=high` pour le backend et pour le frontend. La CI échoue en cas de vulnérabilité **élevée ou critique** en production

### Leçon retenue

`npm audit fix --force` ne doit jamais être lancé sans vérifier ce qu'il modifie il peut **rétrograder** une dépendance et introduire de nouvelles failles

## 2. Détection de secrets — Gitleaks

-   Scan de l'historique Git **aucune fuite** (`no leaks found`)
-   Test avec de faux secrets **2 fuites détectées** (`github-pat`, `generic-api-key`), code de sortie `1`
-   Limite un mot de passe simple n'est pas détecté (pas de forme reconnaissable)
-   Gitleaks est ajouté à la CI le pipeline s'arrête si un secret est trouvé

## 3. Healthcheck — Backend

-   Ajout d'une route `GET /health` qui renvoie `{"status":"ok"}`, avec son test Jest (25/25 tests réussis)
-   Ajout d'un `HEALTHCHECK` dans le Dockerfile du backend Docker appelle `/health` toutes les 10 s (tolérance de 10 s au démarrage, 3 échecs avant `unhealthy`)
-   Résultat statut `health: starting`, puis `healthy`, avec 0 échec (`FailingStreak: 0`) et des vérifications réussies toutes les 10 s (`ExitCode: 0`)
-   Intérêt distinguer un conteneur simplement démarré (`Up`) d'une application qui répond vraiment

## 4. Healthcheck — Frontend

-   Ajout d'un `HEALTHCHECK` dans le Dockerfile du frontend (étape Nginx) Docker vérifie toutes les 10 s que Nginx renvoie la page d'accueil (`http://127.0.0.1/`)
-   Le frontend vérifie uniquement Nginx, pas le backend chaque conteneur contrôle sa propre santé
-   Résultat `health: starting`, puis `healthy` (`FailingStreak: 0`, `ExitCode: 0`)
-   Les deux conteneurs (backend et frontend) sont maintenant `healthy`

## 5. Scan des images — Trivy

| Image | Système (Alpine) | Bibliothèques de l'app | npm (outil livré avec Node) | Total |
|---|---|---|---|---|
| backend | 0 | 0 | 11 HIGH | 11 HIGH, 0 CRITICAL |
| frontend | 3 HIGH (brotli-libs, curl, libcurl) | — | — | 3 HIGH, 0 CRITICAL |

- Les failles ne viennent pas du code du projet, mais des images de base (`node:22-alpine`, `nginx:alpine`)
- Elles sont presque toutes corrigeables (`fixed`), une seule n'a pas de correctif (`http-cache-semantics`)
- npm n'est pas utile pour faire tourner le backend  il augmente la surface d'attaque sans raison
- Trivy voit ce que npm audit ne voit pas le système et les outils présents dans l'image


## 6. Test du site en ligne — OWASP ZAP (baseline, scan passif)

- Cible le site déployé sur le port 4203
- Résultat **0 High**, **2 Medium**, **6 Low**, 2 Informational
- Medium absence de Content-Security-Policy (risque XSS) et de protection anti-clickjacking
- Low version de Nginx affichée (`Server`), et absence des en-têtes X-Content-Type-Options
  Permissions-Policy, Cross-Origin-Opener/Resource/Embedder-Policy
- Cause commune  en-têtes de sécurité HTTP non configurés dans Nginx. Aucune faille dans le code
- Correction prévue  ajouter les en-têtes dans `frontend/nginx.conf` et masquer la version (`server_tokens off`)


## 7. ZAP — Correction

- Ajout dans `nginx.conf` de `server_tokens off` et de 7 en-têtes de sécurité 
  X-Frame-Options, X-Content-Type-Options, Permissions-Policy,
  Cross-Origin-Opener/Resource/Embedder-Policy, Content-Security-Policy.
- Angular option `inlineCritical: false` pour supprimer le JavaScript inline (`onload`) bloqué par la CSP
- Résultat 2 Medium + 6 Low → **1 Medium + 0 Low**
- Alerte restante acceptée  `style-src 'unsafe-inline'`, nécessaire aux styles de composants Angular
  Les scripts restent limités au site (`script-src 'self'`), ce qui protège contre le XSS