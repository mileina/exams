#!/bin/bash
# Script de déploiement complet pour OVH
# Déploie HTTPS, Nginx, certificats Let's Encrypt automatiquement

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         DÉPLOIEMENT COMPLET - HTTPS + CERTIFICATS              ║"
echo "║                    Sur OVH (91.134.133.79)                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si on est en root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Ce script doit être exécuté en root (sudo)"
   exit 1
fi

echo "✓ Exécuté en root"
echo ""

# ==================== ÉTAPE 1: VÉRIFIER L'ENVIRONNEMENT ====================
echo "[1/7] Vérification de l'environnement..."
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi
echo "✓ Docker trouvé: $(docker --version)"

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi
echo "✓ Docker Compose trouvé: $(docker-compose --version)"

# Vérifier les ports
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 80 est déjà utilisé"
    read -p "Veux-tu continuer? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 443 est déjà utilisé"
    read -p "Veux-tu continuer? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✓ Environnement vérifié"
echo ""

# ==================== ÉTAPE 2: INSTALLER LES DÉPENDANCES ====================
echo "[2/7] Installation des dépendances..."
echo ""

apt update
apt install -y nginx certbot python3-certbot-nginx curl wget

echo "✓ Dépendances installées"
echo ""

# ==================== ÉTAPE 3: CRÉER LES RÉPERTOIRES ====================
echo "[3/7] Création des répertoires..."
echo ""

mkdir -p /var/www/certbot
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

echo "✓ Répertoires créés"
echo ""

# ==================== ÉTAPE 4: CONFIGURATION INITIALE NGINX ====================
echo "[4/7] Configuration initiale Nginx (HTTP seulement)..."
echo ""

# Créer la config HTTP de base
cat > /etc/nginx/sites-available/default << 'NGINX_INIT'
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
NGINX_INIT

ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Tester la configuration
if ! nginx -t 2>/dev/null; then
    echo "❌ Erreur de configuration Nginx"
    exit 1
fi

systemctl restart nginx

echo "✓ Nginx configuré (HTTP)"
echo ""

# ==================== ÉTAPE 5: GÉNÉRER LES CERTIFICATS ====================
echo "[5/7] Génération des certificats SSL avec Let's Encrypt..."
echo ""

read -p "Entrez votre email pour Let's Encrypt: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Email requis"
    exit 1
fi

# Domaines à certifier
DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

# Construire les arguments de domaine
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Générer les certificats
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --expand \
    $DOMAIN_ARGS

echo "✓ Certificats générés"
echo ""

# ==================== ÉTAPE 6: CONFIGURATION NGINX HTTPS ====================
echo "[6/7] Configuration Nginx (HTTPS)..."
echo ""

# Copier la configuration HTTPS
if [ -f "/opt/cloud/ssl/nginx-https-production.conf" ]; then
    cp /opt/cloud/ssl/nginx-https-production.conf /etc/nginx/sites-available/default
    echo "✓ Configuration Nginx HTTPS copiée"
else
    echo "⚠️  Fichier nginx-https-production.conf non trouvé"
    echo "   Créant une configuration de base..."
    
    # Créer une configuration minimale si le fichier n'existe pas
    cat > /etc/nginx/sites-available/default << 'NGINX_HTTPS'
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

upstream frontend_backend {
    server 127.0.0.1:3000;
}

upstream api_backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name _;
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name exam.meetly.ovh;
    
    ssl_certificate /etc/letsencrypt/live/exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass http://frontend_backend;
        proxy_set_header Host $host;
    }
}

server {
    listen 443 ssl http2;
    server_name api-exam.meetly.ovh;
    
    ssl_certificate /etc/letsencrypt/live/api-exam.meetly.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-exam.meetly.ovh/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        limit_req zone=api burst=200 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
    }
}
NGINX_HTTPS
fi

# Tester la configuration
if ! nginx -t 2>/dev/null; then
    echo "❌ Erreur de configuration Nginx HTTPS"
    exit 1
fi

systemctl restart nginx

echo "✓ Nginx configuré (HTTPS)"
echo ""

# ==================== ÉTAPE 7: AUTO-RENOUVELLEMENT ====================
echo "[7/7] Configuration de l'auto-renouvellement..."
echo ""

systemctl enable certbot.timer
systemctl start certbot.timer

echo "✓ Auto-renouvellement configuré"
echo ""

# ==================== RÉSUMÉ ====================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ DÉPLOIEMENT RÉUSSI !                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Certificats installés:"
certbot certificates

echo ""
echo "🌐 URLs accessibles:"
echo "  • https://exam.meetly.ovh"
echo "  • https://api-exam.meetly.ovh"
echo "  • https://gateway-exam.meetly.ovh"
echo "  • https://preprod-exam.meetly.ovh"
echo "  • https://preprod-api-exam.meetly.ovh"
echo ""

echo "🔄 Vérifier l'auto-renouvellement:"
echo "  sudo systemctl status certbot.timer"
echo ""

echo "🧪 Tester les certificats:"
echo "  curl -I https://exam.meetly.ovh"
echo ""

echo "📊 Status Nginx:"
systemctl status nginx --no-pager

echo ""
echo "✨ Déploiement HTTPS terminé !"
echo ""
