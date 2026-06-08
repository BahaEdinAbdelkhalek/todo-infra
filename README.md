# Kamka Todo

Une petite application todo en trois parties : un frontend Angular, une API GraphQL en Node.js, et une base PostgreSQL avec un cache Redis. L'application en elle-même est volontairement simple — c'est toute la partie infrastructure autour qui est le vrai sujet.

---

## Lancer le projet

Tu as besoin de Docker Desktop et de Git, c'est tout.

```bash
git clone https://github.com/BahaEdinAbdelkhalek/todo-infra.git
cd todo-infra
cp .env.example .env
```

Ouvre le fichier `.env` et remplace `changeme` par un vrai mot de passe pour la base de données. Ensuite :

```bash
docker compose up --build
```

C'est tout. Docker va construire les images et démarrer les 5 services dans le bon ordre. Ça prend 2-3 minutes la première fois.

| Ce que tu vois | Adresse |
|---|---|
| L'application | http://localhost:3000 |
| L'API GraphQL | http://localhost:4000/graphql |
| La supervision | http://localhost:3001 |

Pour tout arrêter :

```bash
docker compose down
```

Pour tout effacer y compris la base de données :

```bash
docker compose down -v
```

---

## Variables d'environnement

Le fichier `.env` ne doit jamais être commité. Seul `.env.example` est dans le repo pour montrer ce qui est nécessaire.

| Variable | Ce que c'est | Obligatoire |
|---|---|---|
| `POSTGRES_PASSWORD` | Mot de passe de la base | Oui |
| `POSTGRES_USER` | Utilisateur (défaut : todo_user) | Non |
| `POSTGRES_DB` | Nom de la base (défaut : todo_db) | Non |
| `CORS_ORIGIN` | URL autorisée par l'API | Non |
| `FRONTEND_PORT` | Port du frontend (défaut : 3000) | Non |
| `MONITORING_PORT` | Port Uptime Kuma (défaut : 3001) | Non |

Sur Azure, ces variables sont injectées directement dans les Container Apps via des secrets — aucun fichier `.env` n'est déployé sur le serveur.

---

## Structure du projet

```
todo-infra/
├── backend/
│   ├── src/
│   │   ├── index.js       point d'entrée Express + Apollo
│   │   ├── schema.js      schéma GraphQL
│   │   ├── resolvers.js   logique CRUD
│   │   ├── db.js          connexion PostgreSQL et migrations
│   │   └── cache.js       connexion Redis
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/               application Angular 18
│   ├── nginx/nginx.conf   config Nginx
│   └── Dockerfile
├── scripts/
│   ├── deploy.sh          installe Docker + lance la stack sur un serveur vierge
│   ├── backup.sh          sauvegarde PostgreSQL avec rotation automatique
│   └── rollback.sh        revient à une version précédente
├── .github/workflows/
│   ├── analyse.yml                 lint
│   ├── construction.yml            build + push vers ACR
│   ├── deploiement-staging.yml     deploy sur la branche dev
│   └── deploiement-production.yml  deploy sur main avec rollback auto
├── docker-compose.yml
└── .env.example
```

---

## Comment fonctionne le pipeline

Un push déclenche tout dans l'ordre suivant :

```
push sur dev ou main
        │
        ▼
  analyse.yml — lint backend et frontend
  (si ça rate ici, rien d'autre ne tourne)
        │
        ▼
  construction.yml — build des images Docker
  push vers Azure Container Registry
        │
        ├── sur dev ──▶ deploiement-staging.yml
        │               déploie sur l'environnement de staging
        │               vérifie que /health répond 200
        │
        └── sur main ──▶ deploiement-production.yml
                         sauvegarde la révision active
                         déploie en production
                         vérifie que /health répond 200
                         si ça ne répond pas → rollback automatique
```

---

## Supervision

Uptime Kuma démarre avec le reste de la stack. Première visite sur http://localhost:3001 : crée un compte admin.

Ensuite configure ces trois moniteurs :

| Moniteur | URL à surveiller |
|---|---|
| API | http://api:4000/health |
| API (base de données) | http://api:4000/health/ready |
| Frontend | http://frontend/health |

---

## Scripts

Tous les scripts s'arrêtent immédiatement si quelque chose se passe mal (`set -euo pipefail`).

Déployer sur un serveur Linux vierge :
```bash
sudo REPO_URL=https://github.com/BahaEdinAbdelkhalek/todo-infra.git bash scripts/deploy.sh
```

Sauvegarder la base de données :
```bash
bash scripts/backup.sh
```

Revenir à une version précédente :
```bash
bash scripts/rollback.sh sha-abc1234
```

---

## Différences entre le local et Azure

En local tout tourne dans docker-compose. Sur Azure, PostgreSQL et Redis sont remplacés par des services managés Azure — même code, juste les variables d'environnement qui changent.

| | Local | Azure |
|---|---|---|
| Secrets | fichier `.env` | Azure Key Vault |
| Base de données | Postgres dans compose | Azure Database for PostgreSQL |
| Cache | Redis dans compose | Azure Cache for Redis |
| HTTPS | non | géré par Azure |
| Images | buildées localement | buildées par le pipeline, stockées dans ACR |

---

## Secrets GitHub Actions

À ajouter dans ton repo GitHub sous Settings → Secrets → Actions :

| Secret | Comment l'obtenir |
|---|---|
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --sdk-auth --role contributor` |
| `AZURE_RESOURCE_GROUP` | le nom de ton groupe de ressources Azure |
| `ACR_NAME` | le nom de ton Container Registry (sans `.azurecr.io`) |
