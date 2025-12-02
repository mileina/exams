// Tests E2E avec Cypress - Couverture complète de toutes les fonctionnalités

describe('Complete Application Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  describe('Authentication Flow', () => {
    it('should display login page initially', () => {
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('exist');
      cy.get('[data-testid="password-input"]').should('exist');
      cy.get('[data-testid="login-button"]').should('exist');
      cy.contains('Sign up').should('exist');
    });

    it('should show error on invalid email format', () => {
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-button"]').click();
      cy.contains(/invalid|email/i).should('be.visible');
    });

    it('should show error on empty fields', () => {
      cy.get('[data-testid="login-button"]').click();
      cy.contains(/required|empty/i).should('be.visible');
    });

    it('should navigate to signup page', () => {
      cy.contains('Sign up').click();
      cy.get('[data-testid="signup-form"]').should('be.visible');
      cy.get('[data-testid="name-input"]').should('exist');
    });

    it('should complete signup with valid data', () => {
      cy.contains('Sign up').click();
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type(`test-${Date.now()}@example.com`);
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('TestPassword123!');
      cy.get('[data-testid="signup-button"]').click();
      
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.url().should('include', '/dashboard');
    });

    it('should show error on password mismatch', () => {
      cy.contains('Sign up').click();
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type(`test-${Date.now()}@example.com`);
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-testid="signup-button"]').click();
      
      cy.contains(/password|match/i).should('be.visible');
    });

    it('should show error on weak password', () => {
      cy.contains('Sign up').click();
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type(`test-${Date.now()}@example.com`);
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="confirm-password-input"]').type('weak');
      cy.get('[data-testid="signup-button"]').click();
      
      cy.contains(/weak|strong/i).should('be.visible');
    });
  });

  describe('Task Management', () => {
    beforeEach(() => {
      // Login avant chaque test
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
    });

    it('should display empty task list', () => {
      cy.get('[data-testid="tasks-list"]').should('exist');
      cy.contains(/no tasks|empty/i).should('exist');
    });

    it('should display create task form', () => {
      cy.get('[data-testid="create-task-button"]').should('be.visible');
      cy.get('[data-testid="create-task-button"]').click();
      
      cy.get('[data-testid="task-title-input"]').should('be.visible');
      cy.get('[data-testid="task-description-input"]').should('exist');
      cy.get('[data-testid="task-priority-select"]').should('exist');
    });

    it('should create task with valid data', () => {
      cy.get('[data-testid="create-task-button"]').click();
      cy.get('[data-testid="task-title-input"]').type('Buy groceries');
      cy.get('[data-testid="task-description-input"]').type('Milk, eggs, bread');
      cy.get('[data-testid="task-priority-select"]').select('high');
      cy.get('[data-testid="task-submit-button"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain', 'created');
      cy.get('[data-testid="task-item"]').should('contain', 'Buy groceries');
    });

    it('should show error on empty title', () => {
      cy.get('[data-testid="create-task-button"]').click();
      cy.get('[data-testid="task-description-input"]').type('Description without title');
      cy.get('[data-testid="task-submit-button"]').click();
      
      cy.contains(/title|required/i).should('be.visible');
    });

    it('should show error on very long title', () => {
      cy.get('[data-testid="create-task-button"]').click();
      const longTitle = 'a'.repeat(300);
      cy.get('[data-testid="task-title-input"]').type(longTitle);
      cy.get('[data-testid="task-submit-button"]').click();
      
      cy.contains(/too long|characters/i).should('be.visible');
    });

    it('should update task', () => {
      // Créer une tâche
      cy.get('[data-testid="create-task-button"]').click();
      cy.get('[data-testid="task-title-input"]').type('Original Title');
      cy.get('[data-testid="task-submit-button"]').click();
      
      // Mettre à jour
      cy.get('[data-testid="task-edit-button"]').first().click();
      cy.get('[data-testid="task-title-input"]').clear().type('Updated Title');
      cy.get('[data-testid="task-submit-button"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain', 'updated');
      cy.get('[data-testid="task-item"]').should('contain', 'Updated Title');
    });

    it('should mark task as completed', () => {
      // Créer une tâche
      cy.get('[data-testid="create-task-button"]').click();
      cy.get('[data-testid="task-title-input"]').type('Task to complete');
      cy.get('[data-testid="task-submit-button"]').click();
      
      // Cocher comme complétée
      cy.get('[data-testid="task-checkbox"]').first().click();
      cy.get('[data-testid="task-item"]').first().should('have.class', 'completed');
    });

    it('should delete task with confirmation', () => {
      // Créer une tâche
      cy.get('[data-testid="create-task-button"]').click();
      cy.get('[data-testid="task-title-input"]').type('Task to delete');
      cy.get('[data-testid="task-submit-button"]').click();
      
      // Supprimer
      cy.get('[data-testid="task-delete-button"]').first().click();
      cy.get('[data-testid="confirm-button"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain', 'deleted');
      cy.contains('Task to delete').should('not.exist');
    });

    it('should filter tasks by priority', () => {
      // Créer plusieurs tâches
      cy.createTask('High priority task', 'high');
      cy.createTask('Low priority task', 'low');
      
      // Filtrer par high
      cy.get('[data-testid="filter-priority"]').select('high');
      cy.get('[data-testid="task-item"]').should('have.length', 1);
      cy.contains('High priority task').should('exist');
      cy.contains('Low priority task').should('not.exist');
    });

    it('should search tasks by title', () => {
      // Créer plusieurs tâches
      cy.createTask('Buy milk');
      cy.createTask('Write report');
      
      // Chercher
      cy.get('[data-testid="search-input"]').type('milk');
      cy.get('[data-testid="task-item"]').should('have.length', 1);
      cy.contains('Buy milk').should('exist');
      cy.contains('Write report').should('not.exist');
    });

    it('should sort tasks by date', () => {
      // Créer deux tâches avec dates différentes
      cy.createTaskWithDate('First task', '2025-12-31');
      cy.createTaskWithDate('Second task', '2025-01-01');
      
      // Vérifier l'ordre par défaut
      cy.get('[data-testid="task-item"]').first().should('contain', 'First task');
      
      // Inverser le tri
      cy.get('[data-testid="sort-button"]').click();
      cy.get('[data-testid="task-item"]').first().should('contain', 'Second task');
    });
  });

  describe('User Profile', () => {
    beforeEach(() => {
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.get('[data-testid="profile-button"]').click();
    });

    it('should display user profile', () => {
      cy.get('[data-testid="profile-page"]').should('be.visible');
      cy.get('[data-testid="user-email"]').should('contain', 'test@example.com');
    });

    it('should update profile name', () => {
      cy.get('[data-testid="edit-profile-button"]').click();
      cy.get('[data-testid="name-input"]').clear().type('New Name');
      cy.get('[data-testid="save-profile-button"]').click();
      
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain', 'New Name');
    });

    it('should handle logout', () => {
      cy.get('[data-testid="logout-button"]').click();
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should be mobile responsive', () => {
      cy.viewport(375, 667); // iPhone size
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('have.css', 'width', '100%');
    });

    it('should be tablet responsive', () => {
      cy.viewport(768, 1024); // iPad size
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="tasks-list"]').should('be.visible');
    });

    it('should be desktop responsive', () => {
      cy.viewport(1920, 1080);
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="main-content"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('/api/tasks', { forceNetworkError: true });
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.get('[data-testid="error-message"]').should('contain', 'network');
    });

    it('should handle 500 errors', () => {
      cy.intercept('/api/tasks', { statusCode: 500 });
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('should show loading spinner during API calls', () => {
      cy.intercept('/api/tasks', { delay: 1000 }).as('getTasks');
      cy.loginViaUI('test@example.com', 'TestPassword123!');
      cy.visit('http://localhost:3000/dashboard');
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getTasks');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('[data-testid="email-input"]').focus();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'login-button');
    });

    it('should have proper labels', () => {
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
    });

    it('should have proper color contrast', () => {
      cy.checkA11y();
    });
  });
});

// Commandes personnalisées Cypress
Cypress.Commands.add('loginViaUI', (email, password) => {
  cy.visit('http://localhost:3000/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('createTask', (title, priority = 'medium') => {
  cy.get('[data-testid="create-task-button"]').click();
  cy.get('[data-testid="task-title-input"]').type(title);
  cy.get('[data-testid="task-priority-select"]').select(priority);
  cy.get('[data-testid="task-submit-button"]').click();
});

Cypress.Commands.add('createTaskWithDate', (title, date) => {
  cy.get('[data-testid="create-task-button"]').click();
  cy.get('[data-testid="task-title-input"]').type(title);
  cy.get('[data-testid="task-duedate-input"]').type(date);
  cy.get('[data-testid="task-submit-button"]').click();
});

