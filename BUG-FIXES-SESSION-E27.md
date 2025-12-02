# 🐛 Corrections de Bugs - Session E27

**Date** : 2 décembre 2025  
**Status** : ✅ 10 bugs corrigés  

---

## 🔧 Bugs Corrigés

### BUG #1: Input Validation - Formulaire d'enregistrement vide

**Fichier** : `backend/controllers/authController.js`  
**Sévérité** : HIGH - Validation manquante  
**Problème** : Pas de vérification des champs vides avant enregistrement

```javascript
// ❌ AVANT: Pas de validation
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  // ... code continue sans vérifier si les champs sont vides
```

```javascript
// ✅ APRÈS: Validation complète
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  try {
    // Validation des champs obligatoires
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires',
        errors: {
          username: !username ? 'Le nom d\'utilisateur est requis' : null,
          email: !email ? 'L\'email est requis' : null,
          password: !password ? 'Le mot de passe est requis' : null,
          confirmPassword: !confirmPassword ? 'La confirmation est requise' : null
        }
      });
    }

    // Validation longueur
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        message: 'Le nom d\'utilisateur doit faire entre 3 et 30 caractères'
      });
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide'
      });
    }

    // Validation mot de passe
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit faire au moins 8 caractères',
        hint: 'Incluez majuscules, minuscules, chiffres et caractères spéciaux'
      });
    }

    // Vérification confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Vérifier si email existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Cet email est déjà utilisé' 
          : 'Ce nom d\'utilisateur existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = new User({ username, email, password });
    await user.save();

    auditLogger.info('Nouvel utilisateur enregistré', { 
      userId: user._id.toString(), 
      email, 
      username 
    });

    res.status(201).json({ 
      message: 'Enregistrement réussi. Connectez-vous maintenant.',
      userId: user._id 
    });
  } catch (error) {
    logger.error('Erreur enregistrement', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement' });
  }
};
```

---

### BUG #2: Missing Error Handling - Pas de gestion du timeout réseau

**Fichier** : `backend/controllers/orderController.js`  
**Sévérité** : MEDIUM - Appel API sans gestion d'erreur

```javascript
// ❌ AVANT: Pas de timeout ni gestion d'erreur
try {
  await axios.post('http://localhost:8000/notify', {
    to: 'email@example.com',
    // ... données
  });
} catch (error) {
  // Pas de gestion - exception silencieuse
}
```

```javascript
// ✅ APRÈS: Gestion complète avec timeout et retry
const notifyMicroservice = async (notificationData, maxRetries = 3) => {
  const axiosInstance = axios.create({
    timeout: 5000, // 5 secondes timeout
    headers: {
      'Content-Type': 'application/json'
    }
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axiosInstance.post(
        'http://localhost:8000/notify',
        notificationData
      );
      logger.info('Notification envoyée', { 
        attempt, 
        notificationData 
      });
      return response.data;
    } catch (error) {
      logger.warn(`Tentative ${attempt}/${maxRetries} échouée`, {
        error: error.message,
        code: error.code,
        timeout: error.code === 'ECONNABORTED'
      });

      if (attempt === maxRetries) {
        logger.error('Impossible d\'envoyer notification après retries', {
          notificationData,
          lastError: error.message
        });
        throw error;
      }

      // Attendre avant retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};

// Utilisation dans createOrder
try {
  await notifyMicroservice({
    to: 'customer@example.com',
    subject: 'Commande confirmée',
    orderId: savedOrder._id.toString()
  }).catch(error => {
    // Log l'erreur mais ne bloque pas la création
    logger.error('Notification échouée', { error: error.message });
  });
} catch (error) {
  // Erreur capturée et logguée
}
```

---

### BUG #3: Memory Leak - Souscriptions non nettoyées dans useEffect

**Fichier** : `frontend/src/components/TaskList.jsx`  
**Sévérité** : MEDIUM - Fuite mémoire

```javascript
// ❌ AVANT: Pas de cleanup
useEffect(() => {
  const subscription = taskApi.subscribe(tasks => {
    setTasks(tasks);
  });
  // Pas de retour de fonction cleanup!
}, []);
```

```javascript
// ✅ APRÈS: Cleanup correctement
useEffect(() => {
  const subscription = taskApi.subscribe(tasks => {
    setTasks(tasks);
  });

  // Cleanup function appelée au unmount
  return () => {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
    }
  };
}, []);

// Alternative avec AbortController
useEffect(() => {
  const abortController = new AbortController();
  
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        signal: abortController.signal
      });
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('Erreur fetch tasks', { error });
      }
    }
  };

  fetchTasks();

  return () => abortController.abort();
}, []);
```

---

### BUG #4: Race Condition - État obsolète dans closure

**Fichier** : `frontend/src/hooks/useAuth.js`  
**Sévérité** : HIGH - Valeurs obsolètes

```javascript
// ❌ AVANT: State obsolète dans setTimeout
const [isLoading, setIsLoading] = useState(false);

const login = (email, password) => {
  setIsLoading(true);
  setTimeout(() => {
    // isLoading peut être true même si composant est unmounted
    setUser({ email });
  }, 2000);
};
```

```javascript
// ✅ APRÈS: Gérer le cycle de vie
const [isLoading, setIsLoading] = useState(false);
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

const login = (email, password) => {
  setIsLoading(true);
  
  setTimeout(() => {
    // Vérifier que le composant est toujours monté
    if (isMountedRef.current) {
      setUser({ email });
      setIsLoading(false);
    }
  }, 2000);
};
```

---

### BUG #5: XSS Vulnerability - Injection HTML non échappée

**Fichier** : `frontend/src/components/TaskDisplay.jsx`  
**Sévérité** : CRITICAL - Sécurité

```javascript
// ❌ AVANT: Injection HTML dangereuse
<div className="task-content">
  {/* Dangereux! Exécute du JavaScript */}
  <div dangerouslySetInnerHTML={{ __html: taskData.description }} />
</div>
```

```javascript
// ✅ APRÈS: Échappement sécurisé
import DOMPurify from 'dompurify';

<div className="task-content">
  {/* Utiliser une librairie de sanitization */}
  <div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(taskData.description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  }} />
</div>

// Ou simplement échapper le texte
<div className="task-content">
  {taskData.description}
</div>
```

---

### BUG #6: Validation côté serveur manquante - N+1 Query

**Fichier** : `backend/controllers/productController.js`  
**Sévérité** : MEDIUM - Performance

```javascript
// ❌ AVANT: N+1 queries (inefficace)
exports.getProductsWithReviews = async (req, res) => {
  try {
    const products = await Product.find();
    
    // Boucle qui fait une requête par produit!
    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviews = await Review.find({ productId: product._id });
        return { ...product.toObject(), reviews };
      })
    );
    
    res.json(productsWithReviews);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

```javascript
// ✅ APRÈS: Utiliser populate ou aggregation
exports.getProductsWithReviews = async (req, res) => {
  try {
    // Avec populate (recommandé pour simples relations)
    const products = await Product.find()
      .populate('reviews')
      .select('name price description')
      .limit(100);
    
    res.json(products);
  } catch (error) {
    logger.error('Erreur fetch products', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Ou avec aggregation (pour données complexes)
exports.getProductsStatsWithReviews = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          reviewCount: { $size: '$reviews' },
          averageRating: { $avg: '$reviews.rating' }
        }
      },
      { $limit: 100 }
    ]);
    
    res.json(products);
  } catch (error) {
    logger.error('Erreur aggregation', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

---

### BUG #7: Token Persistence - JWT non sauvegardé

**Fichier** : `frontend/src/services/authService.js`  
**Sévérité** : HIGH - Auth ne persiste pas

```javascript
// ❌ AVANT: Token perdu après refresh
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  const { token } = await response.json();
  
  // Token jamais sauvegardé!
  setAuthState({ token, user });
};
```

```javascript
// ✅ APRÈS: Sauvegarder et restaurer token
const login = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { token, user } = await response.json();

    // Sauvegarder en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Mettre à jour l'état
    setAuthState({ token, user });
    
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Restaurer le token au démarrage
const restoreSession = () => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      setAuthState({ token, user });
      return true;
    } catch (error) {
      console.error('Session restore failed:', error);
      logout();
      return false;
    }
  }
  return false;
};

// Logout complet
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  setAuthState({ token: null, user: null });
};
```

---

### BUG #8: Formulaire - État non réinitialisé après soumission

**Fichier** : `frontend/src/components/CreateTaskForm.jsx`  
**Sévérité** : MEDIUM - UX mauvaise

```javascript
// ❌ AVANT: Données persistent après création
const CreateTaskForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    // Pas de réinitialisation du formulaire!
    // L'utilisateur voit les anciennes données
  };
};
```

```javascript
// ✅ APRÈS: Réinitialiser après succès
const CreateTaskForm = ({ onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Valider avant envoi
      if (!formData.title.trim()) {
        setError('Le titre est requis');
        return;
      }

      if (formData.title.length > 255) {
        setError('Le titre ne peut pas dépasser 255 caractères');
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      const newTask = await response.json();

      // Réinitialiser le formulaire après succès
      resetForm();

      // Notifier le parent
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }

      // Toast de succès
      showSuccessMessage('Tâche créée avec succès!');
    } catch (error) {
      setError(error.message);
      console.error('Form submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ 
          ...formData, 
          title: e.target.value 
        })}
        placeholder="Titre de la tâche"
        maxLength="255"
        disabled={isLoading}
      />

      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ 
          ...formData, 
          description: e.target.value 
        })}
        placeholder="Description"
        disabled={isLoading}
      />

      <select
        value={formData.priority}
        onChange={(e) => setFormData({ 
          ...formData, 
          priority: e.target.value 
        })}
        disabled={isLoading}
      >
        <option value="low">Basse</option>
        <option value="medium">Normale</option>
        <option value="high">Haute</option>
      </select>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Création...' : 'Créer la tâche'}
      </button>
    </form>
  );
};
```

---

### BUG #9: Gestion d'état - Mise à jour UI non déclenchée

**Fichier** : `frontend/src/components/TaskList.jsx`  
**Sévérité** : HIGH - UI ne se met pas à jour

```javascript
// ❌ AVANT: Mutation directe du state
const handleDeleteTask = (taskId) => {
  const updatedTasks = tasks;
  updatedTasks = updatedTasks.filter(t => t._id !== taskId);
  setTasks(updatedTasks); // React ne détecte pas le changement!
};
```

```javascript
// ✅ APRÈS: Créer une nouvelle référence
const handleDeleteTask = async (taskId) => {
  try {
    // Appel API d'abord
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erreur suppression');
    }

    // Puis mettre à jour le state (créer un nouveau tableau)
    setTasks(prevTasks => 
      prevTasks.filter(task => task._id !== taskId)
    );

    // Toast de succès
    showSuccessMessage('Tâche supprimée');
  } catch (error) {
    console.error('Delete error:', error);
    showErrorMessage('Erreur lors de la suppression');
  }
};

// Marquer comme complétée
const handleToggleTask = async (taskId, completed) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed })
    });

    if (!response.ok) {
      throw new Error('Erreur mise à jour');
    }

    const updatedTask = await response.json();

    // Mettre à jour le tableau avec la nouvelle tâche
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === taskId ? updatedTask : task
      )
    );
  } catch (error) {
    console.error('Toggle error:', error);
    showErrorMessage('Erreur lors de la mise à jour');
  }
};
```

---

### BUG #10: Pagination - Pas de gestion des limites

**Fichier** : `backend/controllers/taskController.js`  
**Sévérité** : MEDIUM - Performance et sécurité

```javascript
// ❌ AVANT: Pas de limite
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    // Peut retourner des milliers de documents!
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

```javascript
// ✅ APRÈS: Pagination avec limites
const TASKS_PER_PAGE = 20;
const MAX_LIMIT = 100;

exports.getTasks = async (req, res) => {
  try {
    // Récupérer les paramètres de pagination
    let { page = 1, limit = TASKS_PER_PAGE, sort = '-createdAt' } = req.query;

    // Valider et limiter
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(
      Math.max(1, parseInt(limit) || TASKS_PER_PAGE),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    // Récupérer les données
    const [tasks, total] = await Promise.all([
      Task.find({ userId: req.user.userId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments({ userId: req.user.userId })
    ]);

    res.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Erreur getTasks', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Frontend avec pagination
const TaskListWithPagination = () => {
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = async (pageNum) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tasks?page=${pageNum}&limit=20&sort=-createdAt`
      );
      const data = await response.json();
      setTasks(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && <div>Chargement...</div>}
      
      <ul>
        {tasks.map(task => (
          <li key={task._id}>{task.title}</li>
        ))}
      </ul>

      {pagination && (
        <div className="pagination">
          <button 
            onClick={() => fetchTasks(page - 1)}
            disabled={!pagination.hasPrev}
          >
            Précédent
          </button>
          
          <span>
            Page {pagination.page} sur {pagination.pages}
          </span>
          
          <button 
            onClick={() => fetchTasks(page + 1)}
            disabled={!pagination.hasNext}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 📊 Résumé des Corrections

| # | Bug | Sévérité | Type | Status |
|---|-----|----------|------|--------|
| 1 | Validation formulaire vide | HIGH | Input validation | ✅ |
| 2 | Pas de gestion timeout | MEDIUM | Error handling | ✅ |
| 3 | Fuite mémoire useEffect | MEDIUM | Memory leak | ✅ |
| 4 | État obsolète en closure | HIGH | Race condition | ✅ |
| 5 | XSS - HTML injection | CRITICAL | Security | ✅ |
| 6 | N+1 Query MongoDB | MEDIUM | Performance | ✅ |
| 7 | JWT non sauvegardé | HIGH | Auth persistence | ✅ |
| 8 | Formulaire non réinitialisé | MEDIUM | UX | ✅ |
| 9 | État non mis à jour | HIGH | React state | ✅ |
| 10 | Pas de pagination | MEDIUM | Performance/Security | ✅ |

---

## 🎯 Impact

- **Sécurité** : 3 bugs critiques/high fixes (XSS, validation, auth)
- **Performance** : 3 bugs optimisés (N+1, pagination, memory)
- **Fiabilité** : 2 bugs de race condition fixes
- **UX** : 2 bugs d'expérience utilisateur fixes

---

## ✅ Checklist Validation

- [x] Tous les bugs reproduits
- [x] Corrections implémentées
- [x] Tests unitaires passent
- [x] Tests d'intégration passent
- [x] Pas de régression
- [x] Documentation mise à jour
- [x] Code review ✓

---

**Date création** : 2 décembre 2025  
**Date correction** : 2 décembre 2025  
**Changeset** : 10 bugs corrigés + documentation

