// frontend/src/hooks/useAsyncData.js
// BUG #3 FIX: Memory leak dans useEffect
// BUG #4 FIX: Race condition avec stale closures

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ✅ BUG #3 & #4 FIX: Hook pour charger des données asynchrones de manière sûre
 * - Nettoie automatiquement les souscriptions
 * - Prévient les mises à jour sur composant démonté
 * - Évite les race conditions avec AbortController
 */
export const useAsyncData = (asyncFunction, dependencies = [], options = {}) => {
  const {
    onSuccess = null,
    onError = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ BUG #4 FIX: Référence pour vérifier si le composant est encore monté
  const isMountedRef = useRef(true);

  // ✅ BUG #3 FIX: AbortController pour annuler les requêtes
  const abortControllerRef = useRef(new AbortController());

  // ✅ Retraitement avec essais
  const fetchWithRetry = useCallback(async () => {
    let attempts = 0;

    while (attempts < retryCount) {
      try {
        abortControllerRef.current = new AbortController();
        
        // Appeler la fonction avec AbortSignal
        const result = await asyncFunction(abortControllerRef.current.signal);

        // ✅ BUG #4 FIX: Vérifier que le composant est toujours monté
        if (!isMountedRef.current) {
          return;
        }

        setData(result);
        setError(null);
        onSuccess?.(result);
        return; // Succès, quitter
      } catch (err) {
        attempts++;

        // ✅ Ne pas traiter les erreurs d'annulation (AbortError)
        if (err.name === 'AbortError') {
          console.log('Requête annulée');
          return;
        }

        if (attempts >= retryCount) {
          // ✅ BUG #4 FIX: Vérifier que le composant est toujours monté
          if (isMountedRef.current) {
            setError(err);
            onError?.(err);
          }
          return;
        }

        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempts - 1))
        );
      }
    }
  }, [asyncFunction, retryCount, retryDelay, onSuccess, onError]);

  useEffect(() => {
    // ✅ BUG #4 FIX: Marquer le composant comme monté
    isMountedRef.current = true;
    setLoading(true);

    fetchWithRetry();

    // ✅ BUG #3 FIX: Nettoyer et annuler la requête
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
    };
  }, dependencies);

  // ✅ Fonction pour recharger manuellement
  const refetch = useCallback(() => {
    setLoading(true);
    fetchWithRetry();
  }, [fetchWithRetry]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

/**
 * ✅ BUG #3 FIX: Hook pour les événements avec cleanup automatique
 */
export const useEventListener = (eventName, handler, element = window) => {
  const handlerRef = useRef(handler);

  // ✅ Mettre à jour la référence si le handler change
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // ✅ Créer un wrapper pour éviter la stale closure
    const eventListener = (event) => handlerRef.current(event);

    // ✅ Ajouter l'écouteur
    element.addEventListener(eventName, eventListener);

    // ✅ BUG #3 FIX: Nettoyer l'écouteur lors du unmount
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

/**
 * ✅ BUG #3 & #4 FIX: Hook pour les requêtes API avec gestion du cycle de vie
 */
export const useAPI = (method, url, options = {}) => {
  const {
    body = null,
    headers = {},
    onSuccess = null,
    onError = null,
    immediate = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (overrides = {}) => {
    // ✅ Créer un nouveau AbortController pour chaque requête
    abortControllerRef.current = new AbortController();

    try {
      if (isMountedRef.current) {
        setLoading(true);
      }

      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...overrides.headers
        },
        signal: abortControllerRef.current.signal
      };

      if (body) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // ✅ Vérifier que le composant est toujours monté
      if (!isMountedRef.current) {
        return;
      }

      setData(result);
      setError(null);
      onSuccess?.(result);

      return result;
    } catch (err) {
      // ✅ Ne pas traiter les erreurs d'annulation
      if (err.name === 'AbortError') {
        console.log('Requête annulée');
        return;
      }

      // ✅ Vérifier que le composant est toujours monté
      if (isMountedRef.current) {
        setError(err);
        onError?.(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [method, url, body, headers, onSuccess, onError]);

  useEffect(() => {
    // ✅ Marquer le composant comme monté
    isMountedRef.current = true;

    if (immediate) {
      execute();
    }

    // ✅ BUG #3 FIX: Nettoyer à la démontage
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    abort: () => abortControllerRef.current?.abort()
  };
};

export default {
  useAsyncData,
  useEventListener,
  useAPI
};

