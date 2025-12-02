# Journalisation & audit

Ce qui est en place :
- Winston + Morgan sur tous les services (backend, gateway, notifications, stock) avec logs applicatifs + HTTP dans `*/logs/`.
- Fichiers séparés : `app.log`, `error.log`, `audit.log` (événements métier comme login, création de commande, envoi d'email).
- Niveaux configurables via `LOG_LEVEL` (défaut `info`). Console activée en environnement non-production.

Emplacements
- backend : `backend/logs/*`
- gateway : `gateway/logs/*`
- notifications : `microservices/notifications/logs/*`
- stock : `microservices/stock-management/logs/*`

Rotation / nettoyage recommandés
- Ajouter une cron hebdomadaire pour archiver et purger (exemple) :
  - `find /opt/cloud/backend/logs -type f -mtime +14 -delete`
  - ou installer `logrotate` avec une règle `weekly`, `rotate 4`, `compress`.

Audit métier (exemples)
- Connexions réussies / échecs : `backend/logs/audit.log`
- Créations de comptes : `backend/logs/audit.log`
- Créations de commandes : `backend/logs/audit.log`
- Notifications envoyées : `microservices/notifications/logs/audit.log`
- Maj de stock : `microservices/stock-management/logs/audit.log`

Vérifications rapides
- Taille des logs : `du -sh */logs`
- Dernières erreurs backend : `tail -n 50 backend/logs/error.log`
- Derniers events d’audit : `tail -n 50 backend/logs/audit.log`
