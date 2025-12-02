# HTTPS Local Testing Guide

## 🔐 Certificats Auto-Signés

Les certificats auto-signés ont été créés pour tester HTTPS localement :

```
ssl-local/
├── localhost.crt          Certificate (valide 365 jours)
├── localhost.key          Clé privée
├── nginx-localhost.conf   Configuration Nginx
└── setup-nginx-local.sh   Script de setup
```

## 🚀 Installation Rapide

### Étape 1 : Rendre le script exécutable
```bash
chmod +x /home/mil/dev/cloud/ssl-local/setup-nginx-local.sh
```

### Étape 2 : Exécuter le script
```bash
cd /home/mil/dev/cloud/ssl-local
sudo ./setup-nginx-local.sh
```

### Étape 3 : Accéder à HTTPS
```
https://localhost
```

⚠️ **Accepter l'alerte de certificat** (c'est normal pour les auto-signés)

## 🧪 Vérifier

### Vérifier le certificat
```bash
openssl x509 -in ssl-local/localhost.crt -text -noout
```

### Vérifier Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Tester HTTPS
```bash
curl --insecure https://localhost
# ou
curl -k https://localhost
```

## 🛑 Arrêter Nginx

```bash
sudo systemctl stop nginx
# ou
sudo systemctl disable nginx  # Désactiver au démarrage
```

## 📝 Configuration Nginx

La configuration proxy `nginx-localhost.conf` :

- Redirige HTTP (80) → HTTPS (443)
- Proxie vers le Frontend (3000)
- Proxie l'API (5000) sur /api/
- Ajoute les headers de sécurité
- Active compression Gzip

## ⚠️ Important

- ❌ Les certificats auto-signés affichent une alerte
- ❌ À utiliser UNIQUEMENT pour développement/test
- ✅ Pour production : Utiliser Let's Encrypt (gratuit)
- ✅ Voir `../ssl/deploy-https.sh` pour production

## 📊 Comparaison

| Aspect | Local (Auto-signé) | Production (Let's Encrypt) |
|--------|------------------|---------------------------|
| Setup | Rapide (5 min) | Moyen (30 min) |
| Certificat | Auto-signé | Validé |
| Alerte navigateur | Oui ⚠️ | Non ✓ |
| Gratuit | Oui | Oui |
| Auto-renouvellement | Non | Oui |
| Domaine | localhost | meetly.ovh |

## 🔗 Ressources

- OpenSSL: https://www.openssl.org
- Nginx: https://nginx.org
- Let's Encrypt (production): https://letsencrypt.org

---

**Note**: Pour la production, utilisez `../ssl/deploy-https.sh`
