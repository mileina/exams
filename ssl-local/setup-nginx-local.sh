#!/bin/bash
# Setup Nginx local avec certificats auto-signés pour HTTPS testing

set -e

echo "=========================================="
echo "  Setup Nginx Local HTTPS (Test)"
echo "=========================================="
echo ""

# Vérifier si Nginx est installé
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

echo "✓ Nginx installé"
echo ""

# Copier la configuration
echo "Configuration de Nginx..."
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

sudo cp nginx-localhost.conf /etc/nginx/sites-available/localhost
sudo ln -sf /etc/nginx/sites-available/localhost /etc/nginx/sites-enabled/localhost

# Supprimer la config par défaut si elle existe
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
echo "Test de la configuration..."
sudo nginx -t

# Redémarrer Nginx
echo "Redémarrage de Nginx..."
sudo systemctl restart nginx

echo ""
echo "=========================================="
echo "  ✅ Nginx configuré pour HTTPS local"
echo "=========================================="
echo ""
echo "Accès HTTPS :"
echo "  https://localhost"
echo ""
echo "⚠️  Avertissement : Certificat auto-signé"
echo "  Votre navigateur affichera une alerte"
echo "  C'est normal pour les tests locaux"
echo ""
echo "Pour arrêter Nginx :"
echo "  sudo systemctl stop nginx"
echo ""
