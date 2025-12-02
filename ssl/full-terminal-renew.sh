#!/bin/bash
# 🤖 SCRIPT ULTRA-SIMPLE TERMINAL - Renouvellement complet des certificats Render
# Tout ce que tu dois faire: bash ssl/full-terminal-renew.sh

set -e

clear

cat << 'BANNER'

╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║         🚀 RENOUVELLEMENT COMPLET CERTIFICATS RENDER             ║
║                                                                   ║
║         Tout en terminal - Pas besoin du Dashboard!              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

BANNER

echo ""
echo "📋 Étapes:"
echo "  1. Vérifier les certificats actuels"
echo "  2. Vous fournir votre clé API Render"
echo "  3. Renouveler automatiquement (API)"
echo "  4. Vérifier les nouveaux certificats"
echo ""
echo "Durée estimée: 15-20 minutes (avec attentes)"
echo ""

# === ÉTAPE 1: VÉRIFIER LES CERTIFICATS ===

echo "=========================================="
echo "ÉTAPE 1️⃣  - Vérification des certificats"
echo "=========================================="
echo ""

DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

CERTS_TO_RENEW=()

for domain in "${DOMAINS[@]}"; do
    printf "  %-35s " "Vérification: $domain"
    
    EXPIRE_DATE=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
    
    if [ -z "$EXPIRE_DATE" ]; then
        echo "❌ Erreur"
        continue
    fi
    
    EXPIRE_EPOCH=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRE_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -gt 30 ]; then
        echo "✅ OK ($DAYS_LEFT jours)"
    else
        echo "⚠️  À renouveler ($DAYS_LEFT jours)"
        CERTS_TO_RENEW+=("$domain")
    fi
done

echo ""

if [ ${#CERTS_TO_RENEW[@]} -eq 0 ]; then
    echo "✅ Tous les certificats sont valides!"
    echo ""
    echo "Prochaine vérification: dans 30 jours"
    exit 0
fi

echo "Certificats à renouveler: ${#CERTS_TO_RENEW[@]}"
echo ""

# === ÉTAPE 2: OBTENIR LA CLÉ API ===

echo "=========================================="
echo "ÉTAPE 2️⃣  - Configuration API Render"
echo "=========================================="
echo ""

echo "Pour renouveler via API, j'ai besoin de votre clé API Render."
echo ""
echo "Comment obtenir la clé:"
echo "  1. Allez sur: https://dashboard.render.com/account/api-tokens"
echo "  2. Vous verrez: 'Create API Key' ou une clé existante"
echo "  3. Créer une nouvelle clé (ou copier une existante)"
echo "  4. La clé ressemble à: 'rnd_xxxxxxxxxxxxxxxxxxxx'"
echo ""

read -p "Collez votre clé API Render: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ Clé API vide"
    exit 1
fi

echo ""
echo "  Vérification de la clé..."

# Tester rapidement la clé
TEST=$(curl -s \
    -H "Authorization: Bearer $API_KEY" \
    "https://api.render.com/v1/services?limit=1" 2>/dev/null | head -c 100)

if echo "$TEST" | grep -q "error\|invalid\|unauthorized\|Unauthorized"; then
    echo "  ❌ Clé API invalide"
    exit 1
fi

echo "  ✅ Clé API valide!"
echo ""

# === ÉTAPE 3: RENOUVELER VIA API ===

echo "=========================================="
echo "ÉTAPE 3️⃣  - Renouvellement des certificats"
echo "=========================================="
echo ""

# Services mapping
declare -A SERVICE_IDS
declare -A SERVICE_NAMES=(
    ["exam-frontend"]="exam.meetly.ovh"
    ["exam-api"]="api-exam.meetly.ovh"
    ["exam-gateway"]="gateway-exam.meetly.ovh"
    ["exam-preprod-frontend"]="preprod-exam.meetly.ovh"
    ["exam-preprod-api"]="preprod-api-exam.meetly.ovh"
)

echo "Récupération des IDs des services..."
echo ""

# Obtenir la liste des services
SERVICES_JSON=$(curl -s \
    -H "Authorization: Bearer $API_KEY" \
    "https://api.render.com/v1/services")

for service_name in "${!SERVICE_NAMES[@]}"; do
    SERVICE_ID=$(echo "$SERVICES_JSON" | jq -r ".[] | select(.name==\"$service_name\") | .id" 2>/dev/null || echo "")
    
    if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
        echo "  ⚠️  Service '$service_name' non trouvé"
    else
        SERVICE_IDS["$service_name"]="$SERVICE_ID"
        echo "  ✓ $service_name → $SERVICE_ID"
    fi
done

echo ""

RENEWED=0
FAILED=0

for service_name in "${!SERVICE_NAMES[@]}"; do
    domain="${SERVICE_NAMES[$service_name]}"
    service_id="${SERVICE_IDS[$service_name]:-}"
    
    if [ -z "$service_id" ]; then
        echo "⏭️  Saut: $domain (service non trouvé)"
        ((FAILED++))
        continue
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 $domain"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Supprimer le domaine
    echo "  1/3 Suppression du domaine..."
    curl -s -X DELETE \
        -H "Authorization: Bearer $API_KEY" \
        "https://api.render.com/v1/services/$service_id/custom-domains/$domain" > /dev/null 2>&1 || true
    echo "      ✓"
    echo ""
    
    # Attendre
    echo "  2/3 Attente (20 secondes)..."
    for i in {20..1}; do
        printf "\r      ⏳ %2d sec  " $i
        sleep 1
    done
    echo -e "\r      ✓          "
    echo ""
    
    # Ajouter le domaine
    echo "  3/3 Ajout du domaine..."
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"domain\":\"$domain\"}" \
        "https://api.render.com/v1/services/$service_id/custom-domains")
    
    if echo "$RESPONSE" | grep -q "error"; then
        echo "      ❌ Erreur"
        ((FAILED++))
    else
        echo "      ✓"
        ((RENEWED++))
    fi
    
    echo ""
done

echo ""
echo "=========================================="
echo "✅ RÉSUMÉ"
echo "=========================================="
echo ""
echo "  Renouvelés: $RENEWED"
echo "  Échoués: $FAILED"
echo ""

if [ $RENEWED -gt 0 ]; then
    echo "⏳ Les certificats sont en cours de génération..."
    echo ""
    echo "Cela peut prendre 2-5 minutes par domaine."
    echo ""
    echo "Vérifiez dans quelques minutes:"
    echo "  bash ssl/check-all-certificates.sh"
    echo ""
fi

