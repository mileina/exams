# 📊 Système de Supervision et Alertes

**Date** : 2 décembre 2025  
**Objectif** : Supervision complète et alertes pour Production + Préproduction  
**Status** : ✅ En cours d'implémentation

---

## 📋 Vue d'ensemble

Supervision multi-niveaux avec alertes automatiques pour :
- **Production** : Critique (99.99% uptime)
- **Préproduction** : Important (validation avant prod)

---

## 1. Architecture de Supervision

### 1.1 Stack de monitoring

| Composant | Rôle | Environnement |
|-----------|------|----------------|
| **Prometheus** | Collecte métriques | Prod + Preprod |
| **Grafana** | Dashboards + alertes | Prod + Preprod |
| **AlertManager** | Gestion des alertes | Prod + Preprod |
| **Loki** | Agrégation logs | Prod + Preprod |
| **Node Exporter** | Métriques système | Prod + Preprod |

### 1.2 Flux d'alertes

```
Services (métriques + logs)
    ↓
Prometheus (scrape)
    ↓
AlertManager (règles)
    ↓
Notificateurs:
  • Email (ops@meetly.ovh)
  • Slack (#alerts)
  • PagerDuty (incidents critiques)
  • Webhook personnalisé
```

---

## 2. Métriques à Superviser

### 2.1 Santé des services

| Métrique | Seuil | Action |
|----------|-------|--------|
| **CPU usage** | > 80% | Alert Warning |
| | > 95% | Alert Critical |
| **Memory usage** | > 80% | Alert Warning |
| | > 95% | Alert Critical |
| **Disk usage** | > 80% | Alert Warning |
| | > 95% | Alert Critical |
| **Response time** | > 1000ms | Alert Warning |
| | > 5000ms | Alert Critical |

### 2.2 Disponibilité

| Métrique | Seuil | Action |
|----------|-------|--------|
| **Uptime** | < 99.9% (Prod) | Alert Warning |
| | < 99% (Prod) | Alert Critical |
| **Error rate** | > 1% | Alert Warning |
| | > 5% | Alert Critical |
| **HTTP 5xx errors** | > 10/min | Alert Critical |

### 2.3 Base de données

| Métrique | Seuil | Action |
|----------|-------|--------|
| **Connexions** | > 80 | Alert Warning |
| **Query time** | > 1000ms | Alert Warning |
| **Replica lag** | > 5s | Alert Warning |

### 2.4 Certificats SSL

| Métrique | Seuil | Action |
|----------|-------|--------|
| **Expiration** | < 30 jours | Alert Warning |
| | < 7 jours | Alert Critical |
| **Invalid cert** | Immédiat | Alert Critical |

---

## 3. Règles d'Alerte Prometheus

### 3.1 Fichier de configuration

**Emplacement** : `/etc/prometheus/rules/alerts.yml`

```yaml
groups:
  - name: system_alerts
    interval: 30s
    rules:
      # CPU
      - alert: HighCPUUsage
        expr: |
          (100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
        for: 5m
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "CPU élevé sur {{ $labels.instance }}"
          description: "CPU > 80% pendant 5 min (valeur: {{ $value }}%)"

      - alert: CriticalCPUUsage
        expr: |
          (100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 95
        for: 2m
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "CPU CRITIQUE sur {{ $labels.instance }}"
          description: "CPU > 95% pendant 2 min (valeur: {{ $value }}%)"

      # Mémoire
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "Mémoire élevée sur {{ $labels.instance }}"
          description: "Mém > 80% pendant 5 min (valeur: {{ $value }}%)"

      - alert: CriticalMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 95
        for: 2m
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Mémoire CRITIQUE sur {{ $labels.instance }}"
          description: "Mém > 95% pendant 2 min (valeur: {{ $value }}%)"

      # Disque
      - alert: HighDiskUsage
        expr: |
          (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"} / 
           node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"})) * 100 > 80
        for: 5m
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "Disque élevé sur {{ $labels.instance }}"
          description: "Disque > 80% ({{ $labels.device }})"

      - alert: CriticalDiskUsage
        expr: |
          (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"} / 
           node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"})) * 100 > 95
        for: 2m
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Disque CRITIQUE sur {{ $labels.instance }}"
          description: "Disque > 95% ({{ $labels.device }})"

  - name: application_alerts
    interval: 30s
    rules:
      # Erreurs HTTP
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "Taux d'erreur élevé sur {{ $labels.service }}"
          description: "Erreurs 5xx > 1% (valeur: {{ $value }}%)"

      - alert: CriticalErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[1m]) > 0.05
        for: 1m
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Taux d'erreur CRITIQUE sur {{ $labels.service }}"
          description: "Erreurs 5xx > 5% (valeur: {{ $value }}%)"

      # Temps de réponse
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "Temps de réponse élevé sur {{ $labels.service }}"
          description: "P95 > 1s (valeur: {{ $value }}s)"

      # Service down
      - alert: ServiceDown
        expr: |
          up{job!~"prometheus|alertmanager"} == 0
        for: 2m
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Service DOWN: {{ $labels.job }}"
          description: "{{ $labels.instance }} ne répond pas depuis 2 min"

  - name: ssl_alerts
    interval: 3600s
    rules:
      # Certificats
      - alert: SSLCertificateExpiringSoon
        expr: |
          (ssl_certificate_not_after_seconds - time()) / 86400 < 30
        labels:
          severity: warning
          environment: prod
        annotations:
          summary: "Certificat SSL expire bientôt: {{ $labels.domain }}"
          description: "{{ $value }} jours avant expiration"

      - alert: SSLCertificateExpiringCritical
        expr: |
          (ssl_certificate_not_after_seconds - time()) / 86400 < 7
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Certificat SSL CRITIQUE: {{ $labels.domain }}"
          description: "{{ $value }} jours avant expiration"

      - alert: SSLCertificateExpired
        expr: |
          ssl_certificate_not_after_seconds < time()
        labels:
          severity: critical
          environment: prod
        annotations:
          summary: "Certificat SSL EXPIRÉ: {{ $labels.domain }}"
          description: "Action immédiate requise!"
```

---

## 4. Configuration AlertManager

### 4.1 Fichier de configuration

**Emplacement** : `/etc/alertmanager/config.yml`

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  # Route par défaut (prod)
  receiver: 'ops-slack'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

  # Routes spécialisées
  routes:
    # Critiques → PagerDuty + Email
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 5s
      repeat_interval: 5m

    # Warnings → Slack
    - match:
        severity: warning
      receiver: 'ops-slack'
      group_wait: 30s

    # SSL → Email (spécifique)
    - match:
        alertname: 'SSL.*'
      receiver: 'ssl-alerts'
      group_wait: 1s
      repeat_interval: 24h

    # Préproduction → Slack seulement
    - match:
        environment: preprod
      receiver: 'preprod-slack'
      group_wait: 1m

receivers:
  # Critiques
  - name: 'critical'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 ALERTE CRITIQUE'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}\n{{ end }}'
        send_resolved: true
        color: 'danger'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}'
    email_configs:
      - to: 'ops@meetly.ovh'
        from: 'alerts@meetly.ovh'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@meetly.ovh'
        auth_password: 'YOUR_PASSWORD'
        headers:
          Subject: '[CRÍTICO] {{ .GroupLabels.alertname }}'

  # Warnings
  - name: 'ops-slack'
    slack_configs:
      - channel: '#alerts'
        title: '⚠️ ALERTE'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
        send_resolved: true
        color: 'warning'

  # SSL
  - name: 'ssl-alerts'
    email_configs:
      - to: 'devops@meetly.ovh'
        from: 'alerts@meetly.ovh'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@meetly.ovh'
        auth_password: 'YOUR_PASSWORD'
        headers:
          Subject: 'SSL Alert: {{ .GroupLabels.alertname }}'

  # Préproduction
  - name: 'preprod-slack'
    slack_configs:
      - channel: '#preprod-alerts'
        title: '📢 Alerte Préproduction'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
```

---

## 5. Dashboards Grafana

### 5.1 Dashboards à créer

#### Dashboard 1: Santé Globale
- Uptime par service
- Nombre d'erreurs (graphique)
- CPU/Mémoire/Disque
- Répartition des requêtes

#### Dashboard 2: Performance
- Temps de réponse (P50, P95, P99)
- Throughput (req/s)
- Latence par endpoint
- Cache hit rate

#### Dashboard 3: Infrastructure
- CPU usage par instance
- Mémoire par instance
- Disque par instance
- Température (si applicable)

#### Dashboard 4: Base de données
- Connexions actives
- Query time
- Replication lag
- Taille de la DB

#### Dashboard 5: Certificats SSL
- Expiration dates
- Certificate validity
- Renewal status

#### Dashboard 6: Logs
- Error count par service
- Audit events
- Warning trends

---

## 6. Métriques Prometheus personnalisées

### 6.1 Instrumenter les services

**Backend (Express.js)** :

```javascript
const prometheus = require('prom-client');

// Métriques personnalisées
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbQueryDuration = new prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  
  next();
});

// Endpoint Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

---

## 7. Configuration Production

### 7.1 Environnement de production

**Services à monitorer** :
1. Frontend (exam.meetly.ovh)
2. Backend API (api-exam.meetly.ovh)
3. Gateway (gateway-exam.meetly.ovh)
4. MongoDB
5. Nginx (reverse proxy)

**Points de terminaison** :
```
- Prometheus: https://prometheus.exam.meetly.ovh:9090
- Grafana: https://grafana.exam.meetly.ovh:3000
- AlertManager: https://alertmanager.exam.meetly.ovh:9093
```

### 7.2 SLA Production

| Service | Uptime SLA | Réponse | Erreurs |
|---------|-----------|---------|---------|
| Frontend | 99.99% | < 1s (P95) | < 1% |
| API | 99.95% | < 500ms (P95) | < 0.5% |
| Gateway | 99.95% | < 500ms (P95) | < 0.5% |

---

## 8. Configuration Préproduction

### 8.1 Environnement de préproduction

**Services à monitorer** :
1. Frontend Preprod (preprod-exam.meetly.ovh)
2. Backend API Preprod (preprod-api-exam.meetly.ovh)
3. MongoDB Preprod
4. Nginx Preprod

**Points de terminaison** :
```
- Prometheus: http://prometheus.preprod-exam.meetly.ovh:9090
- Grafana: http://grafana.preprod-exam.meetly.ovh:3000
- AlertManager: http://alertmanager.preprod-exam.meetly.ovh:9093
```

### 8.2 SLA Préproduction

| Service | Uptime SLA | Réponse | Erreurs |
|---------|-----------|---------|---------|
| Frontend | 95% | < 2s | < 5% |
| API | 95% | < 1s | < 2% |

---

## 9. Procédures d'Escalade

### 9.1 Sévérité: CRITICAL

**Temps réaction** : < 5 min

1. **Notification** : PagerDuty + Slack + Email
2. **Équipe** : On-call (via PagerDuty)
3. **Actions** :
   - Investigation immédiate
   - Escalade si non résolu en 15 min
   - Communication client si impactant

### 9.2 Sévérité: WARNING

**Temps réaction** : < 30 min

1. **Notification** : Slack
2. **Équipe** : Équipe DevOps
3. **Actions** :
   - Vérification dans les 30 min
   - Planifier correction

### 9.3 Sévérité: INFO

**Pas d'escalade**
- Logs seulement
- Revue hebdomadaire

---

## 10. Playbooks de Réponse

### 10.1 Service DOWN

**Symptôme** : `ServiceDown` alert

**Actions** :
```bash
# 1. Vérifier l'état du service
systemctl status <service>

# 2. Vérifier les logs
tail -f /opt/cloud/<service>/logs/error.log

# 3. Redémarrer si nécessaire
systemctl restart <service>

# 4. Vérifier les métriques
curl http://localhost:9090/metrics
```

### 10.2 CPU/Mémoire élevée

**Symptôme** : `HighCPUUsage` ou `HighMemoryUsage`

**Actions** :
```bash
# 1. Vérifier les processus
top -u <service>
ps aux | grep <service>

# 2. Vérifier les connexions DB
mongostat --interval 1

# 3. Analyser les logs
grep "ERROR\|WARN" /opt/cloud/<service>/logs/app.log | tail -50

# 4. Redémarrer si nécessaire
systemctl restart <service>
```

### 10.3 Certificat SSL expire

**Symptôme** : `SSLCertificateExpiringCritical`

**Actions** :
```bash
# 1. Vérifier le certificat actuel
openssl s_client -connect exam.meetly.ovh:443 | grep -A 2 "notAfter"

# 2. Renouveler
bash ssl/full-terminal-renew.sh

# 3. Vérifier
bash ssl/check-all-certificates.sh
```

---

## 11. Checklist Déploiement

### Phase 1 : Infrastructure de monitoring

- [ ] Installer Prometheus
- [ ] Installer AlertManager
- [ ] Installer Grafana
- [ ] Installer Node Exporter
- [ ] Installer Loki

### Phase 2 : Configuration

- [ ] Configurer rules Prometheus
- [ ] Configurer AlertManager
- [ ] Créer dashboards Grafana
- [ ] Configurer notificateurs (Slack, Email, PagerDuty)

### Phase 3 : Instrumentation

- [ ] Ajouter métriques Prometheus au backend
- [ ] Ajouter métriques au gateway
- [ ] Ajouter métriques aux microservices
- [ ] Tester endpoints `/metrics`

### Phase 4 : Validation

- [ ] Tester alertes (test alert)
- [ ] Vérifier reception Slack
- [ ] Vérifier reception Email
- [ ] Tester PagerDuty
- [ ] Revue des dashboards

### Phase 5 : Documentation

- [ ] Playbooks d'escalade
- [ ] Liste des contacts
- [ ] Procédures de maintenance
- [ ] Training équipe DevOps

---

## 12. Maintenance

### Hebdomadaire
- [ ] Revoir les alertes déclenchées
- [ ] Vérifier l'état des certificats SSL
- [ ] Archiver les logs
- [ ] Vérifier l'espace disque

### Mensuel
- [ ] Revue des métriques de performance
- [ ] Tuning des seuils d'alerte
- [ ] Mise à jour des dashboards
- [ ] Revue des SLA

### Trimestriel
- [ ] Audit de sécurité du monitoring
- [ ] Plan de DR (disaster recovery)
- [ ] Formation de l'équipe
- [ ] Optimisation des alertes

---

## 13. Contacts d'Escalade

| Rôle | Email | Téléphone | Slack |
|------|-------|-----------|-------|
| On-call Engineer | on-call@meetly.ovh | +1-XXX-XXX-XXXX | @on-call |
| DevOps Lead | devops@meetly.ovh | +1-XXX-XXX-XXXX | @devops-lead |
| Backend Lead | backend@meetly.ovh | +1-XXX-XXX-XXXX | @backend-lead |
| Ops Manager | ops@meetly.ovh | +1-XXX-XXX-XXXX | @ops-manager |

---

**Date de création** : 2 décembre 2025  
**Status** : ✅ Documentation complète  
**Prochaine étape** : Implémentation de l'infrastructure

