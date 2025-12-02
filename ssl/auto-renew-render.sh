#!/bin/bash
# Script automatisé pour renouveler les certificats Render via API
# Utilise Render API pour supprimer et rajouter les domaines automatiquement

set -e

echo "=========================================="
echo "  🤖 AUTO-RENEW RENDER CERTIFICATES"
echo "=========================================="
echo ""

# Configuration
RENDER_API_KEY="${RENDER_API_KEY:-}"
SERVICES=(
    "exam-frontend:exam.meetly.ovh"
    "exam-api:api-exam.meetly.ovh"
    "exam-gateway:gateway-exam.meetly.ovh"
    "exam-preprod-frontend:preprod-exam.meetly.ovh"
    "exam-preprod-api:preprod-api-exam.meetly.ovh"
)

# Vérifier la clé API
if [ -z "$RENDER_API_KEY" ]; then
    echo "⚠️  RENDER_API_KEY non définie"
    echo ""
    echo "Pour obtenir votre clé API:"
    echo "1. Allez sur https://dashboard.render.com/account/api-tokens"
    echo "2. Créez une nouvelle clé (ou copiez une existante)"
    echo "3. Exportez: export RENDER_API_KEY='votre-clé'"
    echo ""
    echo "Ensuite relancez ce script:"
    echo "  export RENDER_API_KEY='xxx' && bash ssl/auto-renew-render.sh"
    exit 1
fi

echo "✓ RENDER_API_KEY trouvée"
echo ""

# Fonction pour obtenir l'ID du service
get_service_id() {
    local service_name=$1
    
    echo "  🔍 Récupération ID du service: $service_name"
    
    SERVICE_ID=$(curl -s \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        https://api.render.com/v1/services \
        | grep -o "\"id\":\"[^\"]*\"" | grep -v "^\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
    
    if [ -z "$SERVICE_ID" ]; then
        echo "    ✗ Service '$service_name' non trouvé"
        return 1
    fi
    
    echo "    ✓ ID trouvé: $SERVICE_ID"
    echo "$SERVICE_ID"
}

# Fonction pour obtenir le domaine personnalisé
get_custom_domain() {
    local service_id=$1
    
    curl -s \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$service_id" \
        | grep -o '"customDomain":"[^"]*"' | cut -d'"' -f4
}

# Fonction pour supprimer le domaine personnalisé
delete_custom_domain() {
    local service_id=$1
    local domain=$2
    
    echo "  🗑️  Suppression du domaine: $domain"
    
    curl -s -X DELETE \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$service_id/custom-domains/$domain" \
        > /dev/null 2>&1
    
    echo "    ✓ Domaine supprimé"
}

# Fonction pour ajouter le domaine personnalisé
add_custom_domain() {
    local service_id=$1
    local domain=$2
    
    echo "  ➕ Ajout du domaine: $domain"
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"domain\":\"$domain\"}" \
        "https://api.render.com/v1/services/$service_id/custom-domains")
    
    if echo "$RESPONSE" | grep -q "error"; then
        echo "    ✗ Erreur: $RESPONSE"
        return 1
    fi
    
    echo "    ✓ Domaine ajouté"
}

echo "=========================================="
echo "  SERVICES À TRAITER"
echo "=========================================="
echo ""

for service_entry in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo "$service_entry" | cut -d: -f1)
    DOMAIN=$(echo "$service_entry" | cut -d: -f2)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 Service: $SERVICE_NAME"
    echo "   Domaine: $DOMAIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Récupérer l'ID du service
    SERVICE_ID=$(get_service_id "$SERVICE_NAME") || continue
    echo ""
    
    # Supprimer l'ancien domaine
    delete_custom_domain "$SERVICE_ID" "$DOMAIN"
    echo ""
    
    # Attendre 10 secondes
    echo "  ⏳ Attente de 10 secondes..."
    sleep 10
    echo ""
    
    # Ajouter le nouveau domaine
    add_custom_domain "$SERVICE_ID" "$DOMAIN"
    echo ""
    
    # Attendre avant le prochain
    echo "  ⏳ Attente avant le prochain service..."
    sleep 5
    echo ""
done

echo "=========================================="
echo "  ✅ RENOUVELLEMENT TERMINÉ"
echo "=========================================="
echo ""
echo "Les nouveaux certificats sont en cours de génération."
echo "Cela peut prendre 2-5 minutes par domaine."
echo ""
echo "Vérifiez l'état dans 5-10 minutes:"
echo "  bash ssl/check-all-certificates.sh"
echo ""

