#!/bin/bash
# Setup HTTPS avec Certbot et Let's Encrypt
# Ce script configure automatiquement les certificats SSL pour tous les sous-domaines

set -e

echo "=========================================="
echo "  HTTPS Setup - Let's Encrypt + Certbot"
echo "=========================================="
echo ""

# Vérifier si Certbot est installé
if ! command -v certbot &> /dev/null; then
    echo "Installation de Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo "✓ Certbot installé"
fi

# Vérifier si Nginx est installé
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    sudo apt install -y nginx
    echo "✓ Nginx installé"
fi

echo ""
echo "=========================================="
echo "  Domaines à certifier"
echo "=========================================="
echo ""
echo "Domaines disponibles pour les certificats :"
echo "1. exam.meetly.ovh"
echo "2. api-exam.meetly.ovh"
echo "3. gateway-exam.meetly.ovh"
echo "4. preprod-exam.meetly.ovh"
echo "5. preprod-api-exam.meetly.ovh"
echo ""

read -p "Entrez votre email pour Let's Encrypt: " EMAIL

echo ""
echo "=========================================="
echo "  Génération des certificats SSL"
echo "=========================================="
echo ""

# Créer un certificat wildcard ou individuels
DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

# Générer le certificat avec tous les domaines
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

echo "Génération du certificat SSL pour tous les domaines..."
sudo certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --expand \
    $DOMAIN_ARGS

echo ""
echo "✓ Certificats générés avec succès !"
echo ""
echo "=========================================="
echo "  Configuration Nginx"
echo "=========================================="
echo ""

# Activer Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "✓ Nginx démarré"
echo ""
echo "=========================================="
echo "  Auto-renouvellement"
echo "=========================================="
echo ""

# Configurer l'auto-renouvellement
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✓ Auto-renouvellement configuré"
echo ""
echo "=========================================="
echo "  Certificats installés"
echo "=========================================="
echo ""

# Afficher les certificats
sudo certbot certificates

echo ""
echo "✓ HTTPS est maintenant configuré !"
echo ""
echo "Prochaines étapes :"
echo "1. Copier le fichier nginx.conf en place"
echo "2. Redémarrer Nginx: sudo systemctl restart nginx"
echo "3. Vérifier: https://exam.meetly.ovh"
