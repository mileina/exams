#!/bin/bash
# Script pour vérifier l'état des certificats SSL sur tous les domaines
# Compatible avec Render et OVH

set -e

echo "=========================================="
echo "  Vérification SSL/TLS - Tous domaines"
echo "=========================================="
echo ""

DOMAINS=(
    "exam.meetly.ovh"
    "api-exam.meetly.ovh"
    "gateway-exam.meetly.ovh"
    "preprod-exam.meetly.ovh"
    "preprod-api-exam.meetly.ovh"
)

check_certificate() {
    local domain=$1
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 Domain: $domain"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Résolution DNS
    echo ""
    echo "[DNS Resolution]"
    if nslookup "$domain" 8.8.8.8 &>/dev/null; then
        IP=$(dig +short "$domain" | tail -1)
        echo "✓ Résolu vers: $IP"
    else
        echo "✗ ERREUR: Domaine non résolvable"
        return 1
    fi
    
    # Test HTTP/HTTPS
    echo ""
    echo "[HTTP Status]"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$domain" 2>/dev/null || echo "ERR")
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$domain" 2>/dev/null || echo "ERR")
    echo "  HTTP:  $HTTP_CODE"
    echo "  HTTPS: $HTTPS_CODE"
    
    # Certificat SSL
    echo ""
    echo "[Certificate Details]"
    CERT_INFO=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates -subject -issuer 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$CERT_INFO" | sed 's/^/  /'
    else
        echo "  ✗ Erreur: Impossible de récupérer le certificat"
        return 1
    fi
    
    # Expiration
    echo ""
    echo "[Expiration Status]"
    EXPIRE_DATE=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    EXPIRE_EPOCH=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRE_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -gt 0 ]; then
        echo "  ✓ Valide pour $DAYS_LEFT jours"
    else
        echo "  ✗ EXPIRÉ depuis $(( -$DAYS_LEFT )) jours"
    fi
    
    echo ""
}

# Vérifier tous les domaines
SUCCESS=0
FAILED=0

for domain in "${DOMAINS[@]}"; do
    if check_certificate "$domain"; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
done

echo "=========================================="
echo "  RÉSUMÉ"
echo "=========================================="
echo ""
echo "  ✓ Domaines OK:       $SUCCESS/${#DOMAINS[@]}"
echo "  ✗ Domaines en erreur: $FAILED/${#DOMAINS[@]}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ Tous les certificats sont valides !"
else
    echo "⚠️  Certains certificats ont des problèmes"
fi

echo ""

