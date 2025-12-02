// frontend/src/hooks/usePagination.js
// BUG #10 FIX: Pagination avec limite et validation de sécurité

import { useState, useCallback } from 'react';

// Configuration de sécurité pour la pagination
const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100, // ✅ Limiter pour éviter les requêtes énormes
  MAX_PAGE: 10000 // ✅ Limiter la profondeur de pagination
};

/**
 * Hook pour gérer la pagination de manière sécurisée
 * @param {Object} options - Configuration
 * @param {number} options.initialLimit - Limite initiale (défaut: 20)
 * @param {Function} options.onPaginate - Callback lors d'un changement de page
 * @returns {Object} État et fonctions de pagination
 */
export const usePagination = (options = {}) => {
  const {
    initialLimit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    onPaginate = null
  } = options;

  // ✅ Valider la limite initiale
  const validLimit = Math.min(
    Math.max(initialLimit, PAGINATION_CONFIG.MIN_LIMIT),
    PAGINATION_CONFIG.MAX_LIMIT
  );

  const [pagination, setPagination] = useState({
    page: PAGINATION_CONFIG.DEFAULT_PAGE,
    limit: validLimit,
    total: 0,
    pages: 0
  });

  // ✅ Mettre à jour la limite de manière sécurisée
  const setLimit = useCallback((newLimit) => {
    const validatedLimit = Math.min(
      Math.max(parseInt(newLimit) || PAGINATION_CONFIG.DEFAULT_LIMIT, PAGINATION_CONFIG.MIN_LIMIT),
      PAGINATION_CONFIG.MAX_LIMIT
    );

    setPagination(prev => ({
      ...prev,
      limit: validatedLimit,
      page: PAGINATION_CONFIG.DEFAULT_PAGE // Revenir à la page 1
    }));

    onPaginate?.({
      page: PAGINATION_CONFIG.DEFAULT_PAGE,
      limit: validatedLimit
    });
  }, [onPaginate]);

  // ✅ Aller à une page spécifique
  const goToPage = useCallback((pageNumber) => {
    const validatedPage = Math.min(
      Math.max(parseInt(pageNumber) || PAGINATION_CONFIG.DEFAULT_PAGE, PAGINATION_CONFIG.DEFAULT_PAGE),
      PAGINATION_CONFIG.MAX_PAGE
    );

    // Ne pas aller au-delà du nombre total de pages
    const finalPage = Math.min(validatedPage, pagination.pages || validatedPage);

    if (finalPage !== pagination.page) {
      setPagination(prev => ({
        ...prev,
        page: finalPage
      }));

      onPaginate?.({
        page: finalPage,
        limit: pagination.limit
      });
    }
  }, [pagination.page, pagination.pages, pagination.limit, onPaginate]);

  // ✅ Page suivante
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.page, pagination.pages, goToPage]);

  // ✅ Page précédente
  const prevPage = useCallback(() => {
    if (pagination.page > PAGINATION_CONFIG.DEFAULT_PAGE) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.page, goToPage]);

  // ✅ Mettre à jour le total d'éléments
  const setTotal = useCallback((total) => {
    const pages = Math.ceil(total / pagination.limit);
    setPagination(prev => ({
      ...prev,
      total,
      pages: Math.min(pages, PAGINATION_CONFIG.MAX_PAGE)
    }));
  }, [pagination.limit]);

  // ✅ Réinitialiser la pagination
  const reset = useCallback(() => {
    setPagination({
      page: PAGINATION_CONFIG.DEFAULT_PAGE,
      limit: validLimit,
      total: 0,
      pages: 0
    });
  }, [validLimit]);

  return {
    pagination,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    setTotal,
    reset,
    // Getters utiles
    offset: (pagination.page - 1) * pagination.limit,
    hasNextPage: pagination.page < pagination.pages,
    hasPrevPage: pagination.page > PAGINATION_CONFIG.DEFAULT_PAGE,
    canGoToPage: (pageNum) => {
      const valid = Math.min(Math.max(pageNum, 1), pagination.pages || pageNum);
      return valid !== pagination.page;
    }
  };
};

export default usePagination;

