# 🐛 E27 - Détection et Correction des Bugs

**Date** : 2 décembre 2025  
**Objectif** : Identifier et corriger tous les bugs avant production  
**Status** : 🔄 En cours d'implémentation

---

## 📋 Plan de Test Complet

### 1. Authentification & Compte

#### 1.1 Création de compte
- [ ] Créer avec email valide
- [ ] Créer avec email invalide (formats: abc, @test, test@)
- [ ] Créer avec mot de passe faible (< 6 caractères)
- [ ] Créer avec mot de passe fort
- [ ] Créer avec mêmes password/confirm ✓
- [ ] Créer avec different password/confirm ✗
- [ ] Créer avec email déjà existant
- [ ] Créer avec champs vides
- [ ] Vérifier la validation du formulaire
- [ ] Vérifier le message de succès/erreur

**Bugs trouvés:**
- [ ] Validation email côté client manquante
- [ ] Message d'erreur "email déjà existant" non clair
- [ ] Pas de feedback visuel sur mot de passe faible

#### 1.2 Connexion
- [ ] Connexion avec email/password valides
- [ ] Connexion avec email invalide
- [ ] Connexion avec password invalide
- [ ] Connexion avec email inexistant
- [ ] Connexion avec champs vides
- [ ] Connexion avec email et password vides
- [ ] Tenter 5+ connexions échouées (rate limiting)
- [ ] Vérifier que le token est sauvegardé
- [ ] Vérifier la redirection post-connexion
- [ ] Vérifier le message d'erreur

**Bugs trouvés:**
- [ ] Token non sauvegardé en localStorage
- [ ] Redirection non fonctionnelle
- [ ] Pas de gestion du rate limiting

#### 1.3 Déconnexion
- [ ] Cliquer sur logout
- [ ] Vérifier que le token est supprimé
- [ ] Vérifier la redirection vers login
- [ ] Vérifier que les données utilisateur sont effacées
- [ ] Accéder à une page protégée après logout

**Bugs trouvés:**
- [ ] Token non supprimé

#### 1.4 Gestion du profil
- [ ] Voir le profil utilisateur
- [ ] Modifier le nom
- [ ] Modifier l'email
- [ ] Modifier le mot de passe
- [ ] Modifier l'avatar
- [ ] Supprimer le compte

---

### 2. Fonctionnalités de Tâches

#### 2.1 Création de tâche
- [ ] Créer avec titre valide
- [ ] Créer avec titre vide
- [ ] Créer avec titre très long (> 255 caractères)
- [ ] Créer avec description
- [ ] Créer avec priorité
- [ ] Créer avec date échéance
- [ ] Créer avec catégorie
- [ ] Soumettre sans validation
- [ ] Voir le feedback visuel

**Bugs trouvés:**
- [ ] Pas de validation titre vide
- [ ] Pas de limite caractères
- [ ] Pas de feedback sur succès/erreur

#### 2.2 Affichage des tâches
- [ ] Voir toutes les tâches
- [ ] Voir la liste vide (0 tâches)
- [ ] Voir la liste pleine (100+ tâches)
- [ ] Voir le tri par date
- [ ] Voir le tri par priorité
- [ ] Filtrer par catégorie
- [ ] Filtrer par statut (complétée/non-complétée)
- [ ] Recherche par titre
- [ ] Pagination (si applicable)

**Bugs trouvés:**
- [ ] Pas de tri fonctionnel
- [ ] Pas de recherche
- [ ] Performance lente avec 100+ tâches

#### 2.3 Modification de tâche
- [ ] Modifier le titre
- [ ] Modifier la description
- [ ] Modifier la priorité
- [ ] Modifier la date
- [ ] Modifier la catégorie
- [ ] Modifier avec titre vide
- [ ] Vérifier la sauvegarde
- [ ] Vérifier l'actualisation UI
- [ ] Voir le message de succès

**Bugs trouvés:**
- [ ] Modification ne sauvegarde pas
- [ ] UI non mise à jour
- [ ] Pas de message feedback

#### 2.4 Suppression de tâche
- [ ] Supprimer une tâche
- [ ] Confirmation avant suppression
- [ ] Suppression avec undo (si applicable)
- [ ] Voir le message de confirmation
- [ ] Vérifier la disparition de la tâche
- [ ] Vérifier le compteur

**Bugs trouvés:**
- [ ] Pas de confirmation
- [ ] Suppression immédiate sans feedback
- [ ] Pas de undo

#### 2.5 Marquage complété/non-complété
- [ ] Cocher tâche
- [ ] Décocher tâche
- [ ] Vérifier le changement visuel
- [ ] Vérifier la sauvegarde
- [ ] Vérifier le statut en BD

**Bugs trouvés:**
- [ ] Pas de sauvegarde du statut
- [ ] UI non mise à jour

---

### 3. Interface & UX

#### 3.1 Validation des formulaires
- [ ] Voir les messages d'erreur
- [ ] Voir les highlights sur champs invalides
- [ ] Voir les messages explicites
- [ ] Voir les messages contextuels

**Bugs trouvés:**
- [ ] Pas de validation
- [ ] Messages génériques
- [ ] Pas de highlight

#### 3.2 Feedback utilisateur
- [ ] Toast/notifications sur action réussie
- [ ] Toast/notifications sur erreur
- [ ] Spinner de chargement
- [ ] État désactivé des boutons

**Bugs trouvés:**
- [ ] Pas de toast
- [ ] Pas de spinner
- [ ] Boutons cliquables pendant le chargement

#### 3.3 Responsivité
- [ ] Mobile (320px - 480px)
- [ ] Tablette (481px - 768px)
- [ ] Desktop (769px+)
- [ ] Vérifier les formulaires
- [ ] Vérifier les listes
- [ ] Vérifier les boutons

**Bugs trouvés:**
- [ ] Débordement sur mobile
- [ ] Texte illisible
- [ ] Boutons non cliquables

#### 3.4 Accessibilité
- [ ] Navigation au clavier
- [ ] Labels sur inputs
- [ ] Alt text sur images
- [ ] Contraste des couleurs
- [ ] Focus visible

**Bugs trouvés:**
- [ ] Pas de navigation clavier
- [ ] Pas de labels
- [ ] Contraste insuffisant

---

### 4. Gestion d'Erreurs

#### 4.1 Erreurs réseau
- [ ] Créer une tâche (réseau OK)
- [ ] Créer une tâche (réseau KO)
- [ ] Modifier une tâche (réseau KO)
- [ ] Supprimer une tâche (réseau KO)
- [ ] Voir le message d'erreur réseau

**Bugs trouvés:**
- [ ] Pas de gestion erreur réseau
- [ ] Application freezée
- [ ] Pas de retry

#### 4.2 Erreurs serveur
- [ ] Erreur 500 sur création
- [ ] Erreur 400 sur validation
- [ ] Erreur 401 non authentifié
- [ ] Erreur 403 non autorisé
- [ ] Erreur 404 ressource non trouvée

**Bugs trouvés:**
- [ ] Messages d'erreur serveur non affichés
- [ ] Pas de gestion spécifique par code d'erreur

#### 4.3 Erreurs console
- [ ] Ouvrir la console Chrome/Firefox
- [ ] Chercher les erreurs rouges
- [ ] Chercher les avertissements jaunes
- [ ] Noter tous les messages

**Bugs trouvés:**
- [ ] Erreurs non catchées
- [ ] Warnings ignorés
- [ ] Console spammée

---

### 5. Performance

#### 5.1 Chargement
- [ ] Time to Interactive (TTI)
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Cumulative Layout Shift (CLS)

**Bugs trouvés:**
- [ ] Chargement lent
- [ ] Layout shift
- [ ] Images non optimisées

#### 5.2 Mémoire
- [ ] DevTools → Memory
- [ ] Heap snapshot initial
- [ ] Actions répétées (créer/supprimer)
- [ ] Heap snapshot final
- [ ] Chercher les fuites mémoire

**Bugs trouvés:**
- [ ] Fuites mémoire
- [ ] Croissance RAM infinie

---

## 🧪 Procédure de Test

### Étape 1: Préparation
```bash
# Nettoyer les données
rm -rf ./frontend/node_modules/.cache
npm run clean

# Redémarrer en dev
npm run dev
```

### Étape 2: Test manuel
1. Ouvrir DevTools (F12)
2. Onglet Console → noter les erreurs
3. Onglet Network → vérifier les requêtes
4. Onglet Elements → vérifier la structure
5. Suivre chaque checklist ci-dessus

### Étape 3: Test automatisé
```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Étape 4: Documentation
- Noter chaque bug trouvé
- Ajouter à CHANGELOG.md
- Créer une issue GitHub
- Corriger le bug
- Committer la correction

---

## 🐛 Bugs Courants (Checklist)

### Frontend React
- [ ] State non mis à jour après API call
- [ ] Dépendances manquantes dans useEffect
- [ ] Pas de cleanup dans useEffect
- [ ] Props vides/undefined
- [ ] Re-render infini
- [ ] Clés manquantes dans listes

### API Backend
- [ ] Validation input manquante
- [ ] CORS non configuré
- [ ] Auth token non vérifié
- [ ] Erreur 500 non catchée
- [ ] Pas de pagination
- [ ] N+1 queries en BD

### Base de Données
- [ ] Index manquants
- [ ] Champs non validés
- [ ] Contraintes manquantes
- [ ] Transactions non atomiques

### Sécurité
- [ ] XSS - injection HTML
- [ ] CSRF - Cross-Site Request Forgery
- [ ] SQL Injection (Mongoose: protected)
- [ ] Passwords en plaintext
- [ ] Tokens sans expiration

---

## ✅ Checklist de Correction

Pour chaque bug:

1. **Reproduire** ✓
   - Étapes exactes
   - Environnement (browser, OS)
   - Fréquence (100%, aléatoire)

2. **Analyser** ✓
   - Logs console
   - Network tab
   - DevTools debugger
   - Code source

3. **Fixer** ✓
   - Code change
   - Test unitaire
   - Test d'intégration
   - Test manuel

4. **Documenter** ✓
   - Commit message clair
   - CHANGELOG.md
   - Issue GitHub

5. **Valider** ✓
   - Le bug est fixé
   - Pas de régression
   - Tests passent
   - Code review ✓

---

## 📝 Template Bug Report

```
# Bug: [Titre court]

## Description
[Description détaillée du bug]

## Étapes pour reproduire
1. ...
2. ...
3. ...

## Résultat attendu
[Ce qui devrait se passer]

## Résultat actuel
[Ce qui se passe vraiment]

## Logs/Screenshots
[Screenshots, console logs, network traces]

## Environnement
- OS: [Windows/Mac/Linux]
- Browser: [Chrome 120, Firefox 121, Safari 17]
- Version: [v1.0.0]

## Sévérité
- [ ] Critical (application non fonctionnelle)
- [ ] High (fonctionnalité ne marche pas)
- [ ] Medium (fonctionnalité partiellement)
- [ ] Low (cosmétique, amélioration)

## Solution proposée
[Si applicable]

## Files affectés
- frontend/src/...
- backend/controllers/...
```

---

## 🔧 Outils de Debugging

### Chrome DevTools
```
F12 → Console: Chercher les erreurs rouges
F12 → Network: Vérifier les requêtes API
F12 → Elements: Vérifier le HTML
F12 → Sources: Ajouter des breakpoints
```

### React DevTools
```
npm install -D @react-devtools/shell
React DevTools → Profiler: Identifier les re-renders
React DevTools → Components: Vérifier le state
```

### Redux DevTools (si utilisé)
```
Redux DevTools → Actions: Voir les dispatches
Redux DevTools → State: Vérifier l'état global
```

### Network Throttling
```
DevTools → Network tab → Throttle to: Slow 3G
Simuler une connexion lente
```

---

## 📊 Métriques de Qualité

| Métrique | Cible | Status |
|----------|-------|--------|
| Bugs critiques | 0 | ? |
| Bugs reportés | 0 | ? |
| Test coverage | > 80% | ? |
| Erreurs console | 0 | ? |
| Performance (FCP) | < 1s | ? |
| Accessibility | A+ | ? |

---

## 🎯 Prochaines Étapes

1. **Exécuter tous les tests** → CHANGELOG.md
2. **Corriger les bugs trouvés** → Commits
3. **Tests de régression** → Valider les fixes
4. **Code review** → Vérifier la qualité
5. **Tests en production** → Déployer
6. **Monitoring** → Surveiller les erreurs

---

**Date de création**: 2 décembre 2025  
**Status**: 🔄 En cours  
**Next review**: Après chaque correction

