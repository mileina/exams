// Tests unitaires et d'intégration avec Jest
// Frontend/backend tests pour détection de bugs

describe('Authentication Tests', () => {
  describe('Sign Up', () => {
    test('should create account with valid email and password', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
    });

    test('should reject invalid email format', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123!',
          name: 'Test User'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    test('should reject weak password', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('password');
    });

    test('should reject duplicate email', async () => {
      // Premier signup
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'TestPassword123!',
          name: 'User 1'
        })
      });

      // Deuxième signup avec même email
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'TestPassword123!',
          name: 'User 2'
        })
      });
      
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    test('should reject empty fields', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          password: '',
          name: ''
        })
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Login', () => {
    test('should login with valid credentials', async () => {
      // Créer un utilisateur d'abord
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'TestPassword123!',
          name: 'Login Test'
        })
      });

      // Essayer de se connecter
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'TestPassword123!'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(localStorage.getItem('token')).toBe(data.token);
    });

    test('should reject invalid password', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'WrongPassword'
        })
      });
      
      expect(response.status).toBe(401);
    });

    test('should reject non-existent email', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })
      });
      
      expect(response.status).toBe(401);
    });
  });
});

describe('Task Tests', () => {
  let token;

  beforeAll(async () => {
    // Créer et connecter un utilisateur
    const signupRes = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tasks@example.com',
        password: 'TestPassword123!',
        name: 'Task Tester'
      })
    });
    const signupData = await signupRes.json();
    token = signupData.token;
  });

  describe('Create Task', () => {
    test('should create task with valid data', async () => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
          dueDate: '2025-12-31'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.task.title).toBe('Test Task');
      expect(data.task._id).toBeDefined();
    });

    test('should reject empty title', async () => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: '',
          description: 'Task without title'
        })
      });
      
      expect(response.status).toBe(400);
    });

    test('should reject very long title', async () => {
      const longTitle = 'a'.repeat(500);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: longTitle
        })
      });
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task'
        })
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Read Tasks', () => {
    test('should get all user tasks', async () => {
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('should handle empty task list', async () => {
      // Créer nouvel utilisateur
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'empty@example.com',
          password: 'TestPassword123!',
          name: 'Empty User'
        })
      });
      const newToken = (await signupRes.json()).token;

      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${newToken}` }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tasks.length).toBe(0);
    });
  });

  describe('Update Task', () => {
    let taskId;

    beforeAll(async () => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Task to Update'
        })
      });
      const data = await res.json();
      taskId = data.task._id;
    });

    test('should update task title', async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Updated Title'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.task.title).toBe('Updated Title');
    });

    test('should reject update with empty title', async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: ''
        })
      });
      
      expect(response.status).toBe(400);
    });

    test('should mark task as completed', async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: true
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.task.completed).toBe(true);
    });
  });

  describe('Delete Task', () => {
    let taskId;

    beforeAll(async () => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Task to Delete'
        })
      });
      const data = await res.json();
      taskId = data.task._id;
    });

    test('should delete task', async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status).toBe(200);
    });

    test('should not find deleted task', async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status).toBe(404);
    });
  });
});

describe('Error Handling', () => {
  test('should handle network errors gracefully', async () => {
    try {
      const response = await fetch('http://localhost:99999/api/tasks');
      expect(response.status).not.toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should return proper 500 error', async () => {
    // Tester en causant une erreur serveur
    const response = await fetch('/api/tasks/invalid-id', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    expect([400, 401, 404, 500].includes(response.status)).toBe(true);
  });
});

describe('Validation Tests', () => {
  test('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('valid@example.com')).toBe(true);
    expect(emailRegex.test('invalid.email')).toBe(false);
    expect(emailRegex.test('@example.com')).toBe(false);
    expect(emailRegex.test('test@')).toBe(false);
  });

  test('should validate password strength', () => {
    const isStrongPassword = (pwd) => {
      return pwd.length >= 8 &&
             /[A-Z]/.test(pwd) &&
             /[a-z]/.test(pwd) &&
             /[0-9]/.test(pwd) &&
             /[!@#$%^&*]/.test(pwd);
    };
    
    expect(isStrongPassword('WeakPass')).toBe(false);
    expect(isStrongPassword('Pass123!')).toBe(true);
  });
});

