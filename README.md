# Kamka Todo

Application trois tiers conteneurisée : frontend Angular, API GraphQL Node.js, base de données PostgreSQL, cache Redis.

---

## Lancer le projet en local

### Prérequis

- Docker Desktop installé et démarré
- Git

### Etapes

```bash
git clone https://github.com/BahaEdinAbdelkhalek/todo-infra.git
cd todo-infra
cp .env.example .env
```

Ouvrir `.env` et changer `POSTGRES_PASSWORD` par un vrai mot de passe.

```bash
docker compose up --build
```

| Service       | URL                        |
|---------------|----------------------------|
| Application   | http://localhost:3000      |
| API GraphQL   | http://localhost:4000/graphql |
| Supervision   | http://localhost:3001      |

Arreter la stack :

```bash
docker compose down
```

Supprimer aussi les volumes (base de données) :

```bash
docker compose down -v
```

---

## Variables d'environnement

Copier `.env.example` en `.env`. Ce fichier n'est jamais commité (voir `.gitignore`).

| Variable           | Description                              | Obligatoire |
|--------------------|------------------------------------------|-------------|
| `POSTGRES_PASSWORD`| Mot de passe PostgreSQL                  | Oui         |
| `POSTGRES_USER`    | Utilisateur PostgreSQL (défaut: todo_user) | Non       |
| `POSTGRES_DB`      | Nom de la base (défaut: todo_db)         | Non         |
| `CORS_ORIGIN`      | URL autorisée par l'API                  | Non         |
| `FRONTEND_PORT`    | Port local du frontend (défaut: 3000)    | Non         |
| `MONITORING_PORT`  | Port local Uptime Kuma (défaut: 3001)    | Non         |

Pour Azure : ces variables sont injectées via les secrets Azure Container Apps. Aucun fichier `.env` n'est déployé.

---

## Structure du projet

```
todo-infra/
├── backend/              API Node.js + Apollo GraphQL
│   ├── src/
│   │   ├── index.js      Point d'entrée, Express + Apollo
│   │   ├── schema.js     Schema GraphQL
│   │   ├── resolvers.js  Logique CRUD
│   │   ├── db.js         Connexion PostgreSQL + migrations
│   │   └── cache.js      Connexion Redis + helpers
│   ├── Dockerfile        Build multi-stage, utilisateur non-root
│   └── .env.example      Variables requises
├── frontend/             Application Angular 18
│   ├── src/
│   ├── nginx/            Config Nginx avec envsubst
│   └── Dockerfile        Build Angular + Nginx
├── scripts/
│   ├── deploy.sh         Bootstrap hote Linux + lancement stack
│   ├── backup.sh         Sauvegarde PostgreSQL + rotation
│   └── rollback.sh       Retour arriere vers une image precedente
├── .github/workflows/
│   ├── analyse.yml           Lint backend + frontend
│   ├── construction.yml      Build + push images vers ACR
│   ├── deploiement-staging.yml    Deploy sur branche dev
│   └── deploiement-production.yml Deploy sur branche main + rollback auto
├── docker-compose.yml    Stack locale complete (5 services)
└── .env.example          Template des variables
```

---

## Pipeline CI/CD

```
push sur dev ou main
        │
        ▼
  analyse.yml
  Lint backend + frontend
        │
        ▼
  construction.yml
  Build images Docker
  Push vers Azure Container Registry
        │
        ├── branche dev ──▶ deploiement-staging.yml
        │                   Deploy staging + test de sante
        │
        └── branche main ──▶ deploiement-production.yml
                             Deploy production + test de sante
                             Rollback automatique si echec
```

Chaque etape bloque la suivante. Un echec de lint empeche le build. Un echec du test de sante annule le deploy et restaure la revision precedente automatiquement.

---

## Supervision

Uptime Kuma tourne dans la stack sur le port 3001. Premiere connexion : creer un compte administrateur sur http://localhost:3001.

Moniteurs a configurer apres le premier lancement :

| Nom              | Type  | URL                                  |
|------------------|-------|--------------------------------------|
| API sante        | HTTP  | http://api:4000/health               |
| API pret         | HTTP  | http://api:4000/health/ready         |
| Frontend         | HTTP  | http://frontend/health               |

---

## Scripts Bash

Tous les scripts utilisent `set -euo pipefail` — ils s'arretent immediatement sur toute erreur.

```bash
sudo REPO_URL=https://github.com/BahaEdinAbdelkhalek/todo-infra.git bash scripts/deploy.sh
```

```bash
bash scripts/backup.sh
```

```bash
bash scripts/rollback.sh sha-abc1234
```

---

## Differences dev / prod

| Point                  | Local (docker compose)         | Azure (Container Apps)              |
|------------------------|--------------------------------|-------------------------------------|
| Secrets                | Fichier `.env` local           | Azure Key Vault via secretref       |
| URL API dans frontend  | `http://api:4000` via envsubst | URL interne Container Apps          |
| Base de données        | Postgres dans compose          | Azure Database for PostgreSQL       |
| Cache                  | Redis dans compose             | Azure Cache for Redis               |
| HTTPS                  | Non                            | Gere par Azure automatiquement      |
| Images                 | Buildees localement            | Buildees par CI, stockees dans ACR  |

---

## Secrets pour le pipeline GitHub

A ajouter dans GitHub > Settings > Secrets and variables > Actions :

| Secret                  | Comment l'obtenir                                      |
|-------------------------|--------------------------------------------------------|
| `AZURE_CREDENTIALS`     | `az ad sp create-for-rbac --sdk-auth --role contributor` |
| `AZURE_RESOURCE_GROUP`  | Nom du groupe de ressources Azure                      |
| `ACR_NAME`              | Nom du registre Azure Container Registry (sans .azurecr.io) |
