# 📝 CHANGELOG.md

Toutes les modifications, corrections et améliorations du projet.

---

## [En cours] - 2025-12-02

### 🔒 Sécurité & Ops
- ✅ Route DELETE `/api/orders/:id` protégée par `isAdmin` (contrôle d'accès renforcé).
- ✅ CORS configurable via `ALLOWED_ORIGINS` (pas d'origines larges par défaut).
- ✅ Journalisation centralisée (Winston + Morgan) sur backend/gateway/microservices avec `app.log`, `error.log`, `audit.log`.
- ✅ Pipeline CI/CD GitHub Actions pour préprod → prod (déploiement Docker/Compose via SSH).
- ✅ Documentation API générée depuis les routes : `docs/API.md`.

### 🧪 Testing E27 - Détection et Correction des Bugs

#### Bugs Trouvés et Corrigés

##### Critical 🚨
- [ ] **BUG-001**: Token non sauvegardé en localStorage après connexion
  - **Impact**: Utilisateur ne reste pas connecté
  - **Cause**: Manque de `localStorage.setItem()` après réception du token
  - **Fix**: Ajouter dans `frontend/src/auth/login.jsx`
  - **Status**: À corriger

- [ ] **BUG-002**: Validation email côté client manquante
  - **Impact**: Accepte formats invalides (abc, @test)
  - **Cause**: Input type="text" au lieu de type="email"
  - **Fix**: Changer type="email" + regex validation
  - **Status**: À corriger

- [ ] **BUG-003**: Message d'erreur "email déjà existant" non affiché
  - **Impact**: Utilisateur ne sait pas pourquoi signup échoue
  - **Cause**: Erreur 409 non catchée
  - **Fix**: Ajouter gestion erreur 409 dans signup
  - **Status**: À corriger

- [ ] **BUG-004**: Service DOWN - pas de gestion erreur
  - **Impact**: Application freezée quand API down
  - **Cause**: Pas de timeout sur fetch
  - **Fix**: Ajouter timeout + fallback UI
  - **Status**: À corriger

##### High ⚠️
- [ ] **BUG-005**: État désactivé des boutons pendant chargement
  - **Impact**: Utilisateur clique plusieurs fois = requêtes dupliquées
  - **Cause**: Pas de `disabled` state pendant fetch
  - **Fix**: Ajouter `isLoading` state + désactiver bouton
  - **Status**: À corriger

- [ ] **BUG-006**: Pas de feedback visuel sur mot de passe faible
  - **Impact**: Utilisateur crée compte avec faible mot de passe
  - **Cause**: Validation côté serveur seulement
  - **Fix**: Ajouter validateur client temps réel
  - **Status**: À corriger

- [ ] **BUG-007**: Modification tâche ne sauvegarde pas
  - **Impact**: Modifications perdues
  - **Cause**: Manque de API call PUT après édition
  - **Fix**: Ajouter `handleUpdateTask` avec fetch PUT
  - **Status**: À corriger

- [ ] **BUG-008**: Interface non mise à jour après suppression tâche
  - **Impact**: Tâche toujours visible après suppression
  - **Cause**: State non updated après DELETE API call
  - **Fix**: Filter du state après suppression réussie
  - **Status**: À corriger

##### Medium 📋
- [ ] **BUG-009**: Pas de messages toast/notifications
  - **Impact**: Utilisateur ne sait pas si action a marché
  - **Cause**: Manque composant Toast
  - **Fix**: Installer `react-toastify` + implémenter
  - **Status**: À corriger

- [ ] **BUG-010**: Pas de loader/spinner visible
  - **Impact**: Utilisateur ne sait pas que ça charge
  - **Cause**: Pas de composant Spinner
  - **Fix**: Créer Spinner + afficher pendant fetch
  - **Status**: À corriger

- [ ] **BUG-011**: Formulaires acceptent valeurs vides
  - **Impact**: Envoie valeurs vides à API
  - **Cause**: Pas de validation avant submit
  - **Fix**: Ajouter `required` + validation regex
  - **Status**: À corriger

- [ ] **BUG-012**: Débordement UI sur mobile
  - **Impact**: Buttons non cliquables, texte coupé
  - **Cause**: Width fixed au lieu de responsive
  - **Fix**: Ajouter media queries CSS
  - **Status**: À corriger

- [ ] **BUG-013**: Pas de tri fonctionnel des tâches
  - **Impact**: Tâches dans ordre aléatoire
  - **Cause**: Pas d'implémentation du tri
  - **Fix**: Ajouter bouton sort + logic
  - **Status**: À corriger

- [ ] **BUG-014**: Pas de recherche par titre
  - **Impact**: Difficile de trouver tâche spécifique
  - **Cause**: Pas d'input search
  - **Fix**: Ajouter search input + filter
  - **Status**: À corriger

##### Low 🟢
- [ ] **BUG-015**: Contraste couleurs insuffisant
  - **Impact**: Accessibilité réduite
  - **Cause**: Design original
  - **Fix**: Augmenter opacity/contrast CSS
  - **Status**: À corriger

- [ ] **BUG-016**: Navigation clavier non fonctionnelle
  - **Impact**: Utilisateurs keyboard-only bloqués
  - **Cause**: Pas de `tabindex` et `:focus` styles
  - **Fix**: Ajouter tabindex + focus styles CSS
  - **Status**: À corriger

- [ ] **BUG-017**: Console errors - dépendances manquantes
  - **Impact**: Avertissements console
  - **Cause**: useEffect sans dépendances
  - **Fix**: Ajouter dépendances correctes
  - **Status**: À corriger

---

## [1.0.0] - 2025-12-01

### ✨ Features Initiales

#### Authentification
- ✅ Sign up avec email/password
- ✅ Login avec authentification
- ✅ Logout
- ✅ JWT token management
- ✅ Protéger les routes

#### Gestion des Tâches
- ✅ Créer tâche
- ✅ Lire tâches
- ✅ Mettre à jour tâche
- ✅ Supprimer tâche
- ✅ Marquer comme complétée

#### Infrastructure
- ✅ Backend Express.js
- ✅ Frontend React
- ✅ MongoDB database
- ✅ Docker Compose setup
- ✅ Nginx reverse proxy

### 🔧 Configuration
- ✅ Environment variables
- ✅ CORS configuré
- ✅ Logger Winston
- ✅ Error handling basique

---

## Template pour nouvelles entrées

```markdown
### 🔴 [Sévérité] BUG-XXX: [Titre court]
- **Description**: [Description complète]
- **Cause**: [Cause racine]
- **Impact**: [Impact utilisateur]
- **Fix**: [Solution proposée]
- **Files affectés**: [Fichiers à modifier]
- **Status**: À corriger / En cours / ✅ Corrigé
- **Commit**: [Hash du commit de fix]

### ✨ [Feature] [Titre]
- **Description**: [Description]
- **Files créés**: [Fichiers nouveaux]
- **Status**: ✅ Complété

### 🚀 [Amélioration] [Titre]
- **Description**: [Description]
- **Bénéfice**: [Bénéfice]
- **Status**: ✅ Implémenté
```

---

## Convention de commits

```
[TYPE] Message court

Message long plus détaillé si nécessaire.

Fixes #123 (si fix d'une issue)
Related to #456 (si relié à une issue)
```

### Types de commits:
- `fix:` Correction de bug
- `feat:` Nouvelle fonctionnalité
- `docs:` Documentation
- `style:` Formatage/style
- `refactor:` Refactorisation de code
- `test:` Ajout de tests
- `chore:` Maintenance

---

## Gestion des versions

### Format: [Major].[Minor].[Patch]

- **Major**: Changements incompatibles
- **Minor**: Nouvelles fonctionnalités compatibles
- **Patch**: Corrections de bugs

### Exemple:
- 1.0.0 → Release initiale
- 1.1.0 → Nouvelle fonctionnalité ajoutée
- 1.0.1 → Bug corrigé

---

## Statut des bugs

| Symbole | Signification |
|---------|---------------|
| 🔴 | Critical - Blocker |
| ⚠️ | High - Important |
| 📋 | Medium - Normal |
| 🟢 | Low - Nice to have |
| 🔄 | En cours |
| ✅ | Corrigé/Complété |

---

## Revue avant chaque release

### Checklist Pre-Release
- [ ] Tous les tests passent
- [ ] Zéro erreur console
- [ ] CHANGELOG mis à jour
- [ ] Version bumped
- [ ] Git tag créé
- [ ] Build successful
- [ ] Déploiement successful
- [ ] Smoke tests passent

---

**Last updated**: 2025-12-02  
**Total bugs reportés**: 17  
**Bugs corrigés**: 0  
**En cours**: 0
