#!/bin/bash
# Script pour renouveler les certificats SSL sur Render
# Les certificats Render sont gérés automatiquement via Let's Encrypt

set -e

echo "=========================================="
echo "  Renouvellement Certificats Render"
echo "=========================================="
echo ""

# Vérifier si render-cli est installé
if ! command -v render &> /dev/null; then
    echo "Installation de Render CLI..."
    npm install -g @render-api/cli
    echo "✓ Render CLI installé"
fi

echo ""
echo "=========================================="
echo "  Services avec domaines personnalisés"
echo "=========================================="
echo ""

# Domaines à gérer
DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

echo "Domaines à renouveler :"
for domain in "${DOMAINS[@]}"; do
    echo "  • $domain"
done

echo ""
echo "=========================================="
echo "  Instructions de renouvellement"
echo "=========================================="
echo ""

echo "Pour chaque service dans Render Dashboard:"
echo ""
echo "1. Allez sur le service"
echo "2. Cliquez sur Settings"
echo "3. Scroll down à 'Custom Domain'"
echo "4. Cliquez sur le bouton '...' et sélectionnez 'Delete'"
echo "5. Attendez 2-3 minutes"
echo "6. Cliquez sur 'Add Custom Domain'"
echo "7. Entrez le domaine"
echo "8. Render génère automatiquement un nouveau certificat (2-5 min)"
echo ""

echo "=========================================="
echo "  Vérification des certificats"
echo "=========================================="
echo ""

for domain in "${DOMAINS[@]}"; do
    echo "Vérification : $domain"
    
    # Afficher les détails du certificat
    echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates -subject 2>/dev/null || echo "⚠️  Erreur de connexion"
    
    echo ""
done

echo "✓ Certificats vérifiés"
echo ""

echo "=========================================="
echo "  Notes importantes"
echo "=========================================="
echo ""
echo "• Render renouvelle automatiquement les certificats"
echo "• Pas besoin de Certbot avec Render"
echo "• Les certificats se renouvellent 30 jours avant expiration"
echo "• Chaque renouvellement prend 2-5 minutes"
echo ""

