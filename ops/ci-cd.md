# CI/CD préproduction & production

Workflow
- Fichier : `.github/workflows/ci-cd.yml`
- Déclencheurs : push/PR sur `main` et `workflow_dispatch`.
- Jobs :
  - `build_and_test` : npm ci + lint/build/tests (si présents) sur backend, gateway, notifications, stock, frontend.
  - `deploy_preprod` : SSH sur le serveur préprod, `git reset --hard origin/main`, `docker compose -f docker-compose.preproduction.yml up -d --build`.
  - `deploy_prod` : même principe pour la prod, déclenché après préprod et protégé par l’environnement GitHub `production` (approbation manuelle recommandée).

Secrets requis (à créer dans GitHub → Settings → Secrets and variables → Actions)
- `SSH_HOST` : IP/nom du serveur préprod (et prod si identique).
- `SSH_USER` : utilisateur SSH.
- `SSH_KEY` : clé privée SSH (format PEM, avec accès au repo sur le serveur).
- Optionnel prod distinct : `SSH_HOST_PROD`, `SSH_USER_PROD`, `SSH_KEY_PROD`, `SSH_PORT_PROD`.
- Optionnel port : `SSH_PORT` (défaut 22).

Prérequis côté serveur cible
- Repo présent dans `/opt/cloud` (chemin utilisé par le workflow).
- Docker + Docker Compose installés.
- Fichiers `.env` présents côté serveur pour les valeurs sensibles (JWT_SECRET, MONGO_ROOT_USER, etc.).

Valider le déploiement
- Préprod : `docker compose -f docker-compose.preproduction.yml ps` et `./scripts/healthcheck.sh` (en pointant vers les URLs préprod).
- Prod : `docker compose -f docker-compose.production.yml ps` + `curl -I https://exam.meetly.ovh` / `https://api-exam.meetly.ovh`.
