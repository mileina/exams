// frontend/src/hooks/useAuthPersist.js
// BUG #7 FIX: Persistence du token JWT + restauration session

import { useEffect, useState, useCallback } from 'react';

const useAuthPersist = () => {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
    isLoading: true,
    error: null
  });

  // Restaurer la session au démarrage
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);

        // Valider le token (optionnel: vérifier l'expiration)
        if (isTokenValid(token)) {
          setAuth({
            token,
            user,
            isLoading: false,
            error: null
          });
        } else {
          // Token expiré
          logout();
        }
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Session restore error:', error);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la restauration de session'
      }));
    }
  }, []);

  // Valider token (vérifier expiration JWT)
  const isTokenValid = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      // Vérifier l'expiration
      const expirationTime = decoded.exp * 1000; // exp est en secondes
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Login avec sauvegarde
  const login = useCallback(async (email, password) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user } = await response.json();

      // Sauvegarder le token et user
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Configurer le header Authorization pour les futures requêtes
      setDefaultAuthHeader(token);

      // Mettre à jour l'état
      setAuth({
        token,
        user,
        isLoading: false,
        error: null
      });

      return { token, user };
    } catch (error) {
      const errorMsg = error.message || 'Erreur lors de la connexion';
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg
      }));
      throw error;
    }
  }, []);

  // Logout complet
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    clearDefaultAuthHeader();
    setAuth({
      token: null,
      user: null,
      isLoading: false,
      error: null
    });
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { token } = await response.json();

      // Sauvegarder le nouveau token
      localStorage.setItem('authToken', token);
      setDefaultAuthHeader(token);

      setAuth(prev => ({
        ...prev,
        token
      }));

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  }, [auth.token, logout]);

  return {
    auth,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!auth.token,
    isLoading: auth.isLoading,
    error: auth.error
  };
};

// Helper: Configurer le header Authorization par défaut
const setDefaultAuthHeader = (token) => {
  if (token) {
    // Pour axios ou fetch wrapper
    window.API_TOKEN = token;
  }
};

const clearDefaultAuthHeader = () => {
  delete window.API_TOKEN;
};

export default useAuthPersist;

