# Configuration DNS pour meetly.ovh
# Tableau récapitulatif de tous les enregistrements DNS

## Enregistrements A (IPv4)

| Domaine | Type | Valeur | TTL | Environnement | Statut |
|---------|------|--------|-----|--------------|--------|
| exam.meetly.ovh | A | 91.134.133.79 | 0 | Production | ✅ Actif |
| api-exam.meetly.ovh | A | 91.134.133.79 | 0 | Production | ✅ Actif |
| gateway-exam.meetly.ovh | A | 91.134.133.79 | 0 | Production | ✅ Actif |
| preprod-exam.meetly.ovh | A | 91.134.133.79 | 0 | Préproduction | ✅ Actif |
| preprod-api-exam.meetly.ovh | A | 91.134.133.79 | 0 | Préproduction | ✅ Actif |

## Architecture réseau

```
Internet (91.134.133.79)
        |
        v
    Nginx (Reverse Proxy, Port 80/443)
        |
        +-- exam.meetly.ovh:443 -----> Frontend (localhost:3000)
        |
        +-- api-exam.meetly.ovh:443 -----> Backend API (localhost:5000)
        |
        +-- gateway-exam.meetly.ovh:443 -----> Gateway (localhost:8000)
        |
        +-- preprod-exam.meetly.ovh:443 -----> Frontend Preprod (localhost:3000)
        |
        +-- preprod-api-exam.meetly.ovh:443 -----> Backend Preprod (localhost:5000)
```

## Certificats SSL/TLS

| Domaine | Certificat | Émetteur | Validité | Auto-renouvellement |
|---------|-----------|----------|----------|-------------------|
| exam.meetly.ovh | exam.meetly.ovh | Let's Encrypt | 90 jours | ✅ Oui |
| api-exam.meetly.ovh | api-exam.meetly.ovh | Let's Encrypt | 90 jours | ✅ Oui |
| gateway-exam.meetly.ovh | gateway-exam.meetly.ovh | Let's Encrypt | 90 jours | ✅ Oui |
| preprod-exam.meetly.ovh | preprod-exam.meetly.ovh | Let's Encrypt | 90 jours | ✅ Oui |
| preprod-api-exam.meetly.ovh | preprod-api-exam.meetly.ovh | Let's Encrypt | 90 jours | ✅ Oui |

## Ports utilisés

| Port | Service | Protocole | Description |
|------|---------|-----------|------------|
| 80 | Nginx HTTP | HTTP | Redirection vers HTTPS |
| 443 | Nginx HTTPS | HTTPS | Traffic sécurisé |
| 3000 | Frontend React | HTTP | Interne (via Nginx) |
| 5000 | Backend API | HTTP | Interne (via Nginx) |
| 8000 | Gateway | HTTP | Interne (via Nginx) |
| 27018 | MongoDB | TCP | Interne (pas exposé) |

## Sécurité

### Headers de sécurité
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options (Clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ X-XSS-Protection (XSS protection)
- ✅ Referrer-Policy

### Rate Limiting
- ✅ API générale: 20 req/s (burst 40)
- ✅ API endpoints: 100 req/s (burst 200)
- ✅ Endpoints de login: 5 req/minute (burst 10)

### HTTPS/TLS
- ✅ TLS 1.2 et 1.3
- ✅ Ciphers forts (HIGH:!aNULL:!MD5)
- ✅ Certificats Let's Encrypt

## Redirection HTTP vers HTTPS

Tous les domaines redirigent automatiquement HTTP (port 80) vers HTTPS (port 443).

Exemple :
- http://exam.meetly.ovh → https://exam.meetly.ovh

## Test de configuration

### Vérifier la résolution DNS
```bash
nslookup exam.meetly.ovh
dig exam.meetly.ovh
```

### Vérifier HTTPS
```bash
curl -I https://exam.meetly.ovh
```

### Vérifier le certificat SSL
```bash
echo | openssl s_client -servername exam.meetly.ovh -connect exam.meetly.ovh:443
```

### Vérifier la configuration Nginx
```bash
sudo nginx -t
```

## Maintenance

### Renouvellement manuel des certificats
```bash
sudo certbot renew --dry-run  # Test
sudo certbot renew             # Vrai renouvellement
```

### Vérifier l'auto-renouvellement
```bash
sudo systemctl status certbot.timer
sudo systemctl list-timers certbot.timer
```

### Voir les certificats installés
```bash
sudo certbot certificates
```

## Checklist de déploiement

- [ ] Domaines DNS pointent vers 91.134.133.79
- [ ] Nginx est installé
- [ ] Certbot est installé
- [ ] Certificats SSL générés pour tous les domaines
- [ ] Configuration Nginx en place
- [ ] Nginx redémarré
- [ ] HTTPS fonctionne pour tous les domaines
- [ ] Auto-renouvellement configuré
- [ ] Redirection HTTP → HTTPS fonctionne
- [ ] Rate limiting actif
- [ ] Headers de sécurité présents
