# UFW Firewall - Quick Setup Guide

## PREPRODUCTION

### Activer le firewall
```bash
sudo bash firewall/setup-firewall-preproduction.sh
```

### Vérifier les règles
```bash
sudo ufw status verbose
sudo ufw show added
```

### Supprimer une règle
```bash
sudo ufw delete allow 3000/tcp
```

---

## PRODUCTION

### 1. Setup initial
```bash
sudo bash firewall/setup-firewall-production.sh
```

### 2. Configurer Nginx (reverse proxy)
```bash
# Installer Nginx
sudo apt update && sudo apt install nginx -y

# Copier la configuration
sudo cp firewall/nginx-reverse-proxy-production.conf /etc/nginx/sites-available/cloud-app

# Remplacer "your-domain.com" par votre domaine
sudo nano /etc/nginx/sites-available/cloud-app

# Activer le site
sudo ln -s /etc/nginx/sites-available/cloud-app /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 3. Installer Let's Encrypt SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 4. Vérifier les règles
```bash
sudo ufw status verbose
sudo ufw show added
```

### 5. Monitorer les logs
```bash
# Firewall logs
sudo tail -f /var/log/ufw.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Commandes UFW utiles

```bash
# Voir le statut
sudo ufw status
sudo ufw status verbose
sudo ufw show added

# Activer/désactiver
sudo ufw enable
sudo ufw disable

# Ajouter une règle
sudo ufw allow 8080/tcp
sudo ufw deny 3306/tcp

# Supprimer une règle
sudo ufw delete allow 8080/tcp

# Reset
sudo ufw reset

# Logging
sudo ufw logging on
sudo ufw logging off
```

---

## Règles de sécurité par environnement

### PREPRODUCTION
- ✅ Tous les ports accessibles localement
- ✅ Idéal pour tester et développer
- ⚠️  MongoDB accessible en local

### PRODUCTION
- 🔒 Seuls les ports essentiels ouverts (80, 443, 22)
- 🔒 MongoDB, Notifications, Stock-Management bloqués
- 🔒 Reverse proxy (Nginx) en front
- 🔒 SSL/TLS activé
- 🔒 Logging firewall activé
