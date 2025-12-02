# Guide Complet - Certificats SSL sur Render

**Date** : 2 décembre 2025  
**Objectif** : Renouveler et gérer les certificats SSL sur Render

---

## 📋 Vue d'ensemble

Render gère **automatiquement** les certificats SSL via Let's Encrypt. Vous n'avez pas besoin d'installer Certbot ou de configurer manuellement.

### Services Render
| Service | Domaine | Type | Status |
|---------|---------|------|--------|
| Frontend Prod | `exam.meetly.ovh` | React | 🔄 Render géré |
| API Prod | `api-exam.meetly.ovh` | Node.js | 🔄 Render géré |
| Gateway Prod | `gateway-exam.meetly.ovh` | Node.js | 🔄 Render géré |
| Frontend Preprod | `preprod-exam.meetly.ovh` | React | 🔄 Render géré |
| API Preprod | `preprod-api-exam.meetly.ovh` | Node.js | 🔄 Render géré |

---

## 🔄 Renouveler les certificats (Méthode facile)

### Via le Dashboard Render

#### Pour chaque service :

1. **Aller sur le service**
   - https://dashboard.render.com
   - Sélectionnez le service

2. **Accéder aux paramètres de domaine**
   - Cliquez sur **Settings** (en haut)
   - Scroll down jusqu'à **Custom Domain**

3. **Supprimer l'ancien certificat**
   - Cliquez sur le menu **...** à côté du domaine
   - Sélectionnez **Delete Domain**
   - Confirmez

4. **Attendre la suppression**
   - ⏱️ Attendez 2-3 minutes

5. **Ajouter le nouveau domaine**
   - Cliquez sur **+ Add Custom Domain**
   - Entrez le domaine (ex: `exam.meetly.ovh`)
   - Cliquez sur **Add Domain**

6. **Render génère le certificat**
   - ⏳ Attendez 2-5 minutes
   - Render génère automatiquement un certificat Let's Encrypt
   - Status passe à ✅ **Configured**

---

## 🤖 Automation avec scripts

### Script 1: Vérifier tous les certificats

```bash
bash ssl/check-all-certificates.sh
```

**Affiche:**
- État DNS pour chaque domaine
- Statut HTTP/HTTPS
- Détails du certificat
- Jours restants avant expiration

### Script 2: Renouveler certificats Render

```bash
bash ssl/renew-render-certificates.sh
```

**Instructions pas à pas:**
- Liste les domaines
- Guide pour chaque service
- Vérifie automatiquement après

---

## 🔐 Vérifier manuellement un certificat

### Vérifier la validité

```bash
# Vérifier expiration
echo | openssl s_client -servername exam.meetly.ovh -connect exam.meetly.ovh:443 | \
    openssl x509 -noout -dates

# Résultat attendu:
# notBefore=Jan  1 00:00:00 2025 GMT
# notAfter=Apr  1 00:00:00 2025 GMT (90 jours)
```

### Vérifier l'émetteur

```bash
echo | openssl s_client -servername exam.meetly.ovh -connect exam.meetly.ovh:443 | \
    openssl x509 -noout -issuer

# Résultat attendu:
# issuer=C=US, O=Let's Encrypt, CN=R3
```

### Test complet de sécurité

```bash
# Vérifier TLS 1.2+
curl -I --tlsv1.2 https://exam.meetly.ovh

# Vérifier redirection HTTP → HTTPS
curl -I http://exam.meetly.ovh

# Résultat attendu: 301 ou 302 (redirection)
```

---

## ⏰ Expiration et renouvellement

### Cycle Let's Encrypt
- **Validité** : 90 jours
- **Renouvellement** : 30 jours avant expiration
- **Automatique** : ✅ Render s'en charge

### Calendrier

| Date | Étape |
|------|-------|
| Jour 1 | Certificat généré |
| Jour 30-60 | Renouvellement possible |
| Jour 60-90 | Render renouvelle automatiquement |
| Jour 90 | Ancien certificat expire |

---

## 📊 Tableau de bord Render

### Accéder au dashboard
https://dashboard.render.com/services

### Vérifier les certificats

Pour chaque service :
1. Allez dans **Settings**
2. Scroll à **Custom Domain**
3. Vérifiez le statut ✅

### Affichage courant

```
Domain: exam.meetly.ovh
Status: ✅ Configured (Valid certificate)
Renewal Date: March 15, 2025
```

---

## 🚨 Troubleshooting

### Problème: Certificat non valide

**Solution 1: Supprimer et réajouter**
```bash
1. Dashboard Render
2. Settings > Custom Domain
3. Cliquez sur "..."
4. Delete Domain
5. Attendez 2-3 minutes
6. Add Custom Domain
7. Attendez 2-5 minutes pour génération
```

**Solution 2: Vérifier DNS**
```bash
# Les DNS doivent pointer vers Render
dig exam.meetly.ovh

# Résultat attendu: IP Render
# 37.218.242.x (exemple Render)
```

### Problème: Domaine non résolvable

**Vérifier les enregistrements DNS (OVH)**
```bash
# Doit pointer vers Render
dig exam.meetly.ovh

# Ou vérifier via OVH:
# https://www.ovh.com/manager/
# > Domaines > meetly.ovh > Zone DNS
```

### Problème: HTTPS en erreur

**Vérifier la connexion**
```bash
curl -v https://exam.meetly.ovh

# Vérifier les erreurs de certificat
openssl s_client -connect exam.meetly.ovh:443 -showcerts
```

---

## 📝 Checklist - Renouvellement certificats

- [ ] Accéder à Render Dashboard
- [ ] Pour chaque service (5 total):
  - [ ] Aller dans Settings
  - [ ] Supprimer le domaine personnalisé
  - [ ] Attendre 2-3 minutes
  - [ ] Réajouter le domaine
  - [ ] Attendre 2-5 minutes (génération certificat)
  - [ ] Vérifier ✅ Configured
- [ ] Exécuter `bash ssl/check-all-certificates.sh`
- [ ] Tester tous les domaines
- [ ] Vérifier les logs Render

---

## 📚 Ressources

### Render Docs
- Custom Domains: https://render.com/docs/custom-domains
- SSL/TLS: https://render.com/docs/ssl

### Let's Encrypt
- Certificats gratuits
- Renouvellement automatique
- Support pour les sous-domaines

### Commandes utiles

```bash
# Vérifier expiration (30j avant)
bash ssl/check-all-certificates.sh

# Vérifier DNS
dig exam.meetly.ovh

# Tester HTTPS
curl -I https://exam.meetly.ovh

# Vérifier le certificat
openssl s_client -connect exam.meetly.ovh:443
```

---

## 🎯 Prochaines étapes

1. **Immédiat** : Exécuter le script de vérification
   ```bash
   bash ssl/check-all-certificates.sh
   ```

2. **Si certificats expirés** : Renouveler via Dashboard Render

3. **Monitoring** : Configurer alertes Render pour expiration

4. **Documentation** : Ajouter ce guide au wiki équipe

---

**Signé** : DevOps Team  
**Statut** : ✅ Certificats gérés automatiquement par Render

