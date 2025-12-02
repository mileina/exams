# Runbook d'exploitation (Sprint 5)

Ce runbook couvre l'exploitation courante de la stack Docker (frontend, backend, gateway, microservices notifications/stock et MongoDB) et du reverse proxy HTTPS (Nginx + Certbot) sur OVH.

## 1) Démarrer / arrêter les environnements

- Préproduction : `docker-compose -f docker-compose.preproduction.yml up -d`
- Préproduction (rebuild) : `docker-compose -f docker-compose.preproduction.yml up -d --build`
- Production : `docker-compose -f docker-compose.production.yml up -d`
- Arrêt d'un environnement : `docker-compose -f <fichier> down`
- Vérifier l'état : `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`

Accès applicatifs :
- Front prod : https://exam.meetly.ovh
- API prod : https://api-exam.meetly.ovh
- Gateway prod : https://gateway-exam.meetly.ovh
- Front préprod : https://preprod-exam.meetly.ovh
- API préprod : https://preprod-api-exam.meetly.ovh

## 2) Vérifications rapides après déploiement

1. Conteneurs : `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
2. Reverse proxy : `sudo nginx -t && sudo systemctl reload nginx`
3. Healthchecks applicatifs : `./scripts/healthcheck.sh` (surcharge possible via `FRONTEND_URL`, `API_URL`, `GATEWAY_URL`)
4. HTTPS : `curl -I https://exam.meetly.ovh` et `curl -I https://api-exam.meetly.ovh`
5. MongoDB up : `docker logs prod-mongo | tail -n 20` ou `docker exec prod-mongo mongo --eval "db.adminCommand('ping')"`

## 3) Sauvegardes / restauration MongoDB

> Remplacer `prod-mongo` par `preprod-mongo` si besoin. Conserver les dumps dans un répertoire monté sur le host (ex. `/opt/backups/mongo`).

- Sauvegarde compressée :
  `docker exec prod-mongo sh -c 'mongodump --gzip --archive' > /opt/backups/mongo/prod-$(date +%Y%m%d-%H%M).gz`
- Restauration :
  `cat /opt/backups/mongo/prod-YYYYMMDD-HHMM.gz | docker exec -i prod-mongo mongorestore --gzip --archive`
- Rétention minimale recommandée : 7 jours glissants en préprod, 30 jours en prod.

## 4) Supervision et maintenance récurrente

- Certificats : `sudo certbot renew --dry-run` (mensuel) et `systemctl status certbot.timer`
- Espace disque : `df -h /` et `docker system df`
- Nettoyage images/volumes orphelins (avec validation) : `docker system prune -a`
- Logs applicatifs : `docker logs -f prod-backend` ou `docker logs -f gateway`
- Nginx : `journalctl -u nginx --since "1 hour ago" --no-pager`

## 5) Gestion d'incident rapide

1. Identifier le service en défaut : `./scripts/healthcheck.sh` puis `docker ps` / `docker logs <container>`
2. Redémarrer un service : `docker compose -f docker-compose.production.yml restart <service>`
3. Rouvrir en mode dégradé : stopper uniquement le service fautif, conserver Nginx pour les autres.
4. Valider le retour à la normale : relancer le script de healthcheck et vérifier les codes HTTP (>=200 et <500).
