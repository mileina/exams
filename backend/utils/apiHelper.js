// backend/utils/apiHelper.js
// BUG #2 FIX: Gestion des erreurs réseau avec timeout et retry

const axios = require('axios');
const { logger } = require('../logger');

// Configuration axios avec timeout
const createAxiosInstance = (timeout = 5000) => {
  return axios.create({
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Fonction pour appels avec retry et exponential backoff
const callWithRetry = async (
  url,
  method = 'GET',
  data = null,
  options = {}
) => {
  const {
    maxRetries = 3,
    timeout = 5000,
    backoffMultiplier = 2,
    initialDelay = 1000,
    shouldRetry = (error) => {
      // Par défaut, retry sur erreurs réseau
      return error.code === 'ECONNABORTED' ||
             error.code === 'ECONNREFUSED' ||
             error.code === 'ETIMEDOUT' ||
             (error.response && error.response.status >= 500);
    }
  } = options;

  const axiosInstance = createAxiosInstance(timeout);
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Tentative ${attempt}/${maxRetries}`, {
        url,
        method,
        timeout
      });

      const config = {
        method,
        url,
        timeout,
        ...options.axiosConfig
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axiosInstance(config);

      logger.info(`Appel API réussi`, {
        url,
        method,
        status: response.status,
        attempt
      });

      return response.data;
    } catch (error) {
      lastError = error;

      const errorInfo = {
        url,
        method,
        attempt,
        timeout,
        errorCode: error.code,
        errorMessage: error.message,
        statusCode: error.response?.status
      };

      logger.warn(`Tentative ${attempt}/${maxRetries} échouée`, errorInfo);

      // Vérifier si on doit retry
      if (!shouldRetry(error) || attempt === maxRetries) {
        logger.error(`Erreur permanente après ${attempt} tentatives`, errorInfo);
        throw error;
      }

      // Calcul du délai avec exponential backoff
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);

      logger.debug(`Attente ${delay}ms avant retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Ne devrait pas arriver ici, mais au cas où...
  throw lastError || new Error('Unknown error');
};

module.exports = {
  createAxiosInstance,
  callWithRetry
};

