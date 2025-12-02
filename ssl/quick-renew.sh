#!/bin/bash
# Script simple pour renouveler les certificats Render
# Utilise Render API de manière simple et directe

set -e

clear
cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🔄 RENOUVELLEMENT AUTOMATIQUE CERTIFICATS RENDER               ║
║                                                                   ║
║   Ce script va:                                                   ║
║   1. Supprimer les domaines personnalisés                         ║
║   2. Attendre quelques secondes                                   ║
║   3. Réajouter les domaines                                       ║
║   4. Render génère automatiquement nouveaux certificats           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

EOF

echo "⚠️  Avant de continuer, vous DEVEZ avoir votre clé API Render"
echo ""
echo "Pour obtenir la clé:"
echo "  1. https://dashboard.render.com/account/api-tokens"
echo "  2. Créer une nouvelle clé ou copier une existante"
echo ""
read -p "Avez-vous votre clé API Render? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Clé API requise. Aborted."
    exit 1
fi

read -p "Collez votre clé API Render: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ Clé API vide. Aborted."
    exit 1
fi

# Tester la clé API
echo ""
echo "🔐 Test de la clé API..."

TEST=$(curl -s \
    -H "Authorization: Bearer $API_KEY" \
    https://api.render.com/v1/services \
    | head -c 50)

if echo "$TEST" | grep -q "error\|invalid\|unauthorized"; then
    echo "❌ Clé API invalide ou incorrecte"
    exit 1
fi

echo "✅ Clé API valide!"
echo ""

# Services à mettre à jour
declare -A SERVICES=(
    ["exam-frontend"]="exam.meetly.ovh"
    ["exam-api"]="api-exam.meetly.ovh"
    ["exam-gateway"]="gateway-exam.meetly.ovh"
    ["exam-preprod-frontend"]="preprod-exam.meetly.ovh"
    ["exam-preprod-api"]="preprod-api-exam.meetly.ovh"
)

echo "=========================================="
echo "  SERVICES À RENOUVELER"
echo "=========================================="
for service in "${!SERVICES[@]}"; do
    echo "  • $service → ${SERVICES[$service]}"
done

echo ""
read -p "Continuer? (yes/no): " CONFIRM_RENEW

if [ "$CONFIRM_RENEW" != "yes" ]; then
    echo "❌ Annulé par l'utilisateur"
    exit 0
fi

echo ""
echo "=========================================="
echo "  🔄 RENOUVELLEMENT EN COURS"
echo "=========================================="
echo ""

SUCCESS=0
FAILED=0

for SERVICE_NAME in "${!SERVICES[@]}"; do
    DOMAIN="${SERVICES[$SERVICE_NAME]}"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 $SERVICE_NAME → $DOMAIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Récupérer tous les services et chercher le nôtre
    echo "🔍 Récupération des services..."
    
    SERVICES_JSON=$(curl -s \
        -H "Authorization: Bearer $API_KEY" \
        "https://api.render.com/v1/services" | jq '.' 2>/dev/null)
    
    # Chercher le service par nom
    SERVICE_ID=$(echo "$SERVICES_JSON" | jq -r ".[] | select(.name==\"$SERVICE_NAME\") | .id" 2>/dev/null)
    
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
        echo "❌ Service '$SERVICE_NAME' non trouvé"
        echo ""
        ((FAILED++))
        continue
    fi
    
    echo "✓ Service ID: $SERVICE_ID"
    echo ""
    
    # Supprimer le domaine personnalisé
    echo "🗑️  Suppression du domaine..."
    
    DELETE_RESPONSE=$(curl -s -X DELETE \
        -H "Authorization: Bearer $API_KEY" \
        "https://api.render.com/v1/services/$SERVICE_ID/custom-domains/$DOMAIN")
    
    if echo "$DELETE_RESPONSE" | grep -q "error"; then
        echo "⚠️  Erreur lors de la suppression (domaine peut être vide)"
    else
        echo "✓ Domaine supprimé"
    fi
    
    echo ""
    
    # Attendre
    echo "⏳ Attente de 15 secondes..."
    for i in {15..1}; do
        printf "\r   Attente: %2d secondes" $i
        sleep 1
    done
    echo -e "\r✓ Attente terminée         "
    echo ""
    
    # Rajouter le domaine
    echo "➕ Ajout du domaine..."
    
    ADD_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"domain\":\"$DOMAIN\"}" \
        "https://api.render.com/v1/services/$SERVICE_ID/custom-domains")
    
    if echo "$ADD_RESPONSE" | grep -q "error\|\"error\""; then
        echo "❌ Erreur lors de l'ajout: $ADD_RESPONSE"
        echo ""
        ((FAILED++))
    else
        echo "✓ Domaine ajouté"
        echo ""
        echo "⏳ Render génère le certificat (2-5 minutes)..."
        echo ""
        ((SUCCESS++))
    fi
done

echo ""
echo "=========================================="
echo "  ✅ RÉSUMÉ"
echo "=========================================="
echo ""
echo "  ✓ Réussis: $SUCCESS"
echo "  ❌ Échoués: $FAILED"
echo ""

if [ $SUCCESS -gt 0 ]; then
    echo "Les nouveaux certificats sont en cours de génération."
    echo ""
    echo "Vérifiez l'état dans 5-10 minutes:"
    echo "  bash ssl/check-all-certificates.sh"
    echo ""
fi

