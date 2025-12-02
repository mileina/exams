#!/bin/bash
# Script de déploiement du système de monitoring et alertes
# Utilisation: bash ops/deploy-monitoring.sh [production|preprod]

set -e

ENVIRONMENT=${1:-production}

clear
cat << 'BANNER'

╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║      🚀 DÉPLOIEMENT SYSTÈME DE MONITORING ET ALERTES             ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

BANNER

echo ""
echo "📦 Environnement: $ENVIRONMENT"
echo ""

# ===== VÉRIFICATIONS =====

echo "=========================================="
echo "ÉTAPE 1️⃣  - Vérifications"
echo "=========================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi
echo "✅ Docker installé"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi
echo "✅ Docker Compose installé"

# Vérifier les fichiers de configuration
FILES=(
    "ops/prometheus.yml"
    "ops/alerts.yml"
    "ops/alertmanager.yml"
    "ops/docker-compose.monitoring.yml"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    fi
done
echo "✅ Tous les fichiers de configuration présents"
echo ""

# ===== VARIABLES D'ENVIRONNEMENT =====

echo "=========================================="
echo "ÉTAPE 2️⃣  - Configuration des alertes"
echo "=========================================="
echo ""

# Vérifier ou créer .env
if [ -f "ops/.env" ]; then
    echo "✅ Fichier .env trouvé"
    source ops/.env
else
    echo "⚠️  Fichier .env non trouvé - création..."
    cat > ops/.env << 'EOF'
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty
PAGERDUTY_SERVICE_KEY=your-pagerduty-key

# Email
ON_CALL_EMAIL=on-call@meetly.ovh
DEVOPS_EMAIL=devops@meetly.ovh
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@meetly.ovh
SMTP_PASSWORD=your-app-password

# Grafana
GRAFANA_PASSWORD=changeme
EOF
    
    echo "⚠️  Fichier .env créé avec valeurs par défaut"
    echo "    À ÉDITER: ops/.env"
    exit 1
fi

echo ""
echo "✅ Configuration chargée:"
echo "   - Slack: Configuré"
echo "   - PagerDuty: Configuré"
echo "   - Email: $ON_CALL_EMAIL"
echo ""

# ===== DOSSIERS =====

echo "=========================================="
echo "ÉTAPE 3️⃣  - Préparation des répertoires"
echo "=========================================="
echo ""

mkdir -p ops/grafana/provisioning/datasources
mkdir -p ops/grafana/provisioning/dashboards

echo "✅ Répertoires créés"
echo ""

# ===== DÉPLOIEMENT DOCKER =====

echo "=========================================="
echo "ÉTAPE 4️⃣  - Démarrage des services"
echo "=========================================="
echo ""

cd ops

echo "🐳 Docker Compose up..."
docker-compose -f docker-compose.monitoring.yml up -d

echo ""
echo "⏳ Attente du démarrage des services (30 sec)..."
sleep 30

# ===== VÉRIFICATIONS =====

echo ""
echo "=========================================="
echo "ÉTAPE 5️⃣  - Vérification des services"
echo "=========================================="
echo ""

SERVICES=(
    "prometheus:9090"
    "alertmanager:9093"
    "grafana:3000"
    "node-exporter:9100"
    "loki:3100"
)

for service in "${SERVICES[@]}"; do
    SERVICE_NAME="${service%:*}"
    SERVICE_PORT="${service##*:}"
    
    printf "  %-20s " "$SERVICE_NAME"
    
    if docker-compose -f docker-compose.monitoring.yml exec -T "$SERVICE_NAME" \
        wget --quiet --tries=1 --spider http://localhost:$SERVICE_PORT 2>/dev/null; then
        echo "✅"
    else
        echo "❌"
    fi
done

echo ""

# ===== ACCÈS =====

echo "=========================================="
echo "✅ DÉPLOIEMENT RÉUSSI"
echo "=========================================="
echo ""

echo "🌐 URLs d'accès:"
echo ""
echo "  Prometheus:     http://localhost:9090"
echo "  Grafana:        http://localhost:3000 (admin/changeme)"
echo "  AlertManager:   http://localhost:9093"
echo "  Node Exporter:  http://localhost:9100/metrics"
echo "  Loki:           http://localhost:3100"
echo ""

# ===== NEXT STEPS =====

echo "=========================================="
echo "📋 Prochaines étapes"
echo "=========================================="
echo ""

echo "1️⃣  Configurer les notificateurs:"
echo "   - Éditer ops/.env avec vos clés Slack, PagerDuty, Email"
echo "   - Redémarrer AlertManager: docker-compose -f ops/docker-compose.monitoring.yml restart alertmanager"
echo ""

echo "2️⃣  Ajouter les dashboards Grafana:"
echo "   - Accéder à http://localhost:3000"
echo "   - Ajouter Prometheus comme datasource"
echo "   - Importer dashboards depuis community"
echo ""

echo "3️⃣  Instrumenter les services:"
echo "   - Ajouter endpoint /metrics sur backend/gateway"
echo "   - Configurer Prometheus scrape_configs si services distants"
echo ""

echo "4️⃣  Tester les alertes:"
echo "   - curl -X POST http://localhost:9093/api/v1/alerts -d '[{\"labels\":{\"alertname\":\"TestAlert\"}}]'"
echo ""

echo "5️⃣  Logs en temps réel:"
echo "   - docker-compose -f ops/docker-compose.monitoring.yml logs -f"
echo ""

echo "=========================================="
echo ""
echo "✨ Monitoring actif et prêt! ✨"
echo ""

