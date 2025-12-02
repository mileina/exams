#!/bin/bash
# Script de déploiement HTTPS complet
# Configure Nginx + Certbot + auto-renouvellement

set -e

echo "=========================================="
echo "  SPRINT 3 - Déploiement HTTPS"
echo "=========================================="
echo ""

# 1. Installer les dépendances
echo "[1/5] Installation des dépendances..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx curl wget

echo "✓ Dépendances installées"
echo ""

# 2. Créer les répertoires nécessaires
echo "[2/5] Création des répertoires..."
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

echo "✓ Répertoires créés"
echo ""

# 3. Configuration initiale Nginx (HTTP seulement pour Certbot)
echo "[3/5] Configuration initiale Nginx (pour Certbot)..."

sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name exam.meetly.ovh api-exam.meetly.ovh gateway-exam.meetly.ovh preprod-exam.meetly.ovh preprod-api-exam.meetly.ovh;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true

sudo nginx -t
sudo systemctl restart nginx

echo "✓ Nginx configuré (HTTP)"
echo ""

# 4. Générer les certificats SSL
echo "[4/5] Génération des certificats SSL avec Let's Encrypt..."
echo ""
echo "Veuillez entrer votre adresse email pour les notifications Let's Encrypt:"
read EMAIL

sudo certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --expand \
    -d exam.meetly.ovh \
    -d api-exam.meetly.ovh \
    -d gateway-exam.meetly.ovh \
    -d preprod-exam.meetly.ovh \
    -d preprod-api-exam.meetly.ovh

echo "✓ Certificats SSL générés"
echo ""

# 5. Configuration finale Nginx (HTTPS)
echo "[5/5] Configuration finale Nginx (HTTPS)..."

sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX_EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backends
upstream frontend {
    server 127.0.0.1:3000;
}

upstream api {
    server 127.0.0.1:5000;
}

upstream gateway {
    server 127.0.0.1:8000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Production Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name exam.meetly.ovh;

    ssl_certificate /etc/letsencrypt/live/exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    location / {
        limit_req zone=general burst=40 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Production API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api-exam.meetly.ovh;

    ssl_certificate /etc/letsencrypt/live/api-exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/auth/login {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        limit_req zone=api burst=200 nodelay;
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Production Gateway
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gateway-exam.meetly.ovh;

    ssl_certificate /etc/letsencrypt/live/gateway-exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway-exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        limit_req zone=api burst=200 nodelay;
        proxy_pass http://gateway;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Preproduction Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name preprod-exam.meetly.ovh;

    ssl_certificate /etc/letsencrypt/live/preprod-exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preprod-exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        limit_req zone=general burst=40 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Preproduction API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name preprod-api-exam.meetly.ovh;

    ssl_certificate /etc/letsencrypt/live/preprod-api-exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preprod-api-exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        limit_req zone=api burst=200 nodelay;
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

sudo nginx -t
sudo systemctl restart nginx

echo "✓ Nginx configuré (HTTPS)"
echo ""

# 6. Configurer l'auto-renouvellement
echo "[6/6] Configuration de l'auto-renouvellement..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✓ Auto-renouvellement configuré"
echo ""

echo "=========================================="
echo "  ✅ HTTPS Déployé avec succès !"
echo "=========================================="
echo ""
echo "URLs accessibles:"
echo "  • https://exam.meetly.ovh"
echo "  • https://api-exam.meetly.ovh"
echo "  • https://gateway-exam.meetly.ovh"
echo "  • https://preprod-exam.meetly.ovh"
echo "  • https://preprod-api-exam.meetly.ovh"
echo ""
echo "Vérifier les certificats:"
echo "  sudo certbot certificates"
echo ""
echo "Tester le renouvellement:"
echo "  sudo certbot renew --dry-run"
echo ""
