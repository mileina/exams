#!/bin/bash
# Script pour vérifier et renouveler les certificats en local
# Sans dépendre de Render API (utilise des vérifications OpenSSL)

set -e

clear
cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   📊 VÉRIFICATION ET RENOUVELLEMENT CERTIFICATS                   ║
║                                                                   ║
║   Utilise OpenSSL pour vérifier les certificats existants         ║
║   et affiche des instructions pour le renouvellement              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

EOF

# Domaines
DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

# Fonction pour vérifier un certificat
check_cert() {
    local domain=$1
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 Domaine: $domain"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Vérifier la résolution DNS
    echo "[1/4] 🌐 Vérification DNS"
    if ! nslookup "$domain" 8.8.8.8 &>/dev/null; then
        echo "  ❌ Domaine non résolvable"
        return 1
    fi
    
    IP=$(dig +short "$domain" | tail -1)
    echo "  ✓ Résolu vers: $IP"
    echo ""
    
    # Vérifier HTTPS
    echo "[2/4] 🔒 Vérification HTTPS"
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$domain" 2>/dev/null || echo "ERR")
    
    if [ "$HTTPS_CODE" == "200" ] || [ "$HTTPS_CODE" == "301" ] || [ "$HTTPS_CODE" == "302" ]; then
        echo "  ✓ HTTPS fonctionne (Code: $HTTPS_CODE)"
    else
        echo "  ❌ HTTPS non accessible (Code: $HTTPS_CODE)"
        return 1
    fi
    echo ""
    
    # Vérifier le certificat
    echo "[3/4] 📄 Détails du certificat"
    
    CERT_INFO=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates -subject -issuer 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "  ❌ Impossible de récupérer le certificat"
        return 1
    fi
    
    echo "$CERT_INFO" | while read line; do
        echo "  $line"
    done
    echo ""
    
    # Vérifier expiration
    echo "[4/4] ⏰ État d'expiration"
    
    EXPIRE_DATE=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    EXPIRE_EPOCH=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRE_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -gt 30 ]; then
        echo "  ✅ Valide pour $DAYS_LEFT jours (pas besoin de renouveler)"
        return 0
    elif [ "$DAYS_LEFT" -gt 0 ]; then
        echo "  ⚠️  ATTENTION: $DAYS_LEFT jours restants!"
        echo "     → À renouveler bientôt"
        return 2
    else
        echo "  ❌ EXPIRÉ depuis $(( -$DAYS_LEFT )) jours!"
        echo "     → URGENT: Renouveler maintenant"
        return 3
    fi
}

# Vérifier tous les domaines
RENEW_NEEDED=0
TOTAL_CHECKED=0

echo "=========================================="
echo "  VÉRIFICATION DE TOUS LES CERTIFICATS"
echo "=========================================="

for domain in "${DOMAINS[@]}"; do
    check_cert "$domain"
    RESULT=$?
    ((TOTAL_CHECKED++))
    
    if [ $RESULT -gt 1 ]; then
        ((RENEW_NEEDED++))
    fi
done

echo ""
echo "=========================================="
echo "  📊 RÉSUMÉ"
echo "=========================================="
echo ""
echo "  Domaines vérifiés: $TOTAL_CHECKED"
echo "  À renouveler: $RENEW_NEEDED"
echo ""

if [ $RENEW_NEEDED -eq 0 ]; then
    echo "✅ Tous les certificats sont valides!"
    echo ""
    echo "Prochaine vérification recommandée: dans 30 jours"
    exit 0
fi

echo ""
echo "=========================================="
echo "  🔄 RENOUVELLEMENT"
echo "=========================================="
echo ""

echo "Les certificats suivants doivent être renouvelés:"
echo ""

for domain in "${DOMAINS[@]}"; do
    EXPIRE_DATE=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    EXPIRE_EPOCH=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRE_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -lt 30 ]; then
        echo "  • $domain ($DAYS_LEFT jours)"
    fi
done

echo ""
echo "Options pour renouveler:"
echo ""
echo "1️⃣  Via Render Dashboard (simple):"
echo "    - https://dashboard.render.com"
echo "    - Pour chaque service: Settings > Custom Domain"
echo "    - Delete > Attendre 2 min > Add"
echo ""

echo "2️⃣  Via API (automatisé):"
echo "    - bash ssl/quick-renew.sh"
echo "    - Vous devez avoir votre clé API Render"
echo ""

echo "3️⃣  Vérifier après renouvellement:"
echo "    - bash ssl/check-all-certificates.sh"
echo "    - Attendre 5-10 minutes pour génération"
echo ""

