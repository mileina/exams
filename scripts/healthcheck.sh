#!/usr/bin/env bash

# Healthcheck rapide des services front/API/gateway et de Docker.
# Personnalisation possible via les variables :
#   FRONTEND_URL (defaut: http://localhost:3000)
#   API_URL (defaut: http://localhost:5000/)
#   GATEWAY_URL (defaut: http://localhost:8000/)

set -u

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:5000/}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000/}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-5}"

failures=0

echo "== État des conteneurs (docker) =="
if command -v docker >/dev/null 2>&1; then
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "docker non disponible sur cette machine"
fi
echo

check_http() {
  local url="$1"
  local label="$2"
  local status

  status=$(curl -k -s -o /dev/null -m "${TIMEOUT_SECONDS}" -w "%{http_code}" "$url" || echo "000")

  if [[ "$status" == "000" ]]; then
    echo "[KO] ${label} injoignable (${url})"
    failures=$((failures + 1))
    return
  fi

  if [[ "$status" =~ ^5 ]]; then
    echo "[KO] ${label} répond ${status} (${url})"
    failures=$((failures + 1))
  else
    echo "[OK] ${label} répond ${status} (${url})"
  fi
}

echo "== Vérifications HTTP =="
check_http "$FRONTEND_URL" "frontend"
check_http "$API_URL" "API"
check_http "$GATEWAY_URL" "gateway"

echo
if [[ "$failures" -gt 0 ]]; then
  echo "Healthcheck terminé avec ${failures} échec(s)."
  exit 1
fi

echo "Healthcheck terminé sans échec."
