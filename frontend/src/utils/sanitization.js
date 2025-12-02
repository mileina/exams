// frontend/src/utils/sanitization.js
// BUG #5 FIX: Prévention XSS avec DOMPurify et validation

import DOMPurify from 'dompurify';

/**
 * Configuration de nettoyage pour différents contextes
 */
const SANITIZE_CONFIGS = {
  // Contenu utilisateur simple (pas de HTML)
  PLAIN_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },

  // Contenu avec HTML basique (titres, listes, liens)
  RICH_TEXT: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false
  },

  // Contenu très strict (seulement du texte)
  STRICT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false
  }
};

/**
 * ✅ BUG #5 FIX: Nettoyer une chaîne pour éliminer les scripts
 * @param {string} input - Texte à nettoyer
 * @param {string} type - Type de contenu ('plain', 'rich', 'strict')
 * @returns {string} Contenu nettoyé et sûr
 */
export const sanitizeInput = (input, type = 'plain') => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Normaliser le type
  let config;
  switch (type) {
    case 'rich':
      config = SANITIZE_CONFIGS.RICH_TEXT;
      break;
    case 'strict':
      config = SANITIZE_CONFIGS.STRICT;
      break;
    case 'plain':
    default:
      config = SANITIZE_CONFIGS.PLAIN_TEXT;
  }

  // ✅ Utiliser DOMPurify pour nettoyer
  const cleaned = DOMPurify.sanitize(input, config);
  
  // ✅ Limiter la longueur
  return cleaned.substring(0, 5000);
};

/**
 * ✅ BUG #5 FIX: Vérifier si du contenu contient du HTML suspect
 * @param {string} input - Texte à vérifier
 * @returns {boolean} True si du HTML/JS suspect est détecté
 */
export const containsSuspiciousContent = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /on\w+\s*=/gi, // onclick=, onload=, etc.
    /javascript:/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * ✅ BUG #5 FIX: Valider et nettoyer une URL
 * @param {string} url - URL à valider
 * @returns {string|null} URL valide ou null
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // ✅ Autoriser seulement http et https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    // URL invalide
    return null;
  }
};

/**
 * ✅ BUG #5 FIX: Nettoyer un objet JSON contenant du contenu utilisateur
 * @param {Object} obj - Objet à nettoyer
 * @param {string[]} fieldsToClean - Champs à nettoyer
 * @returns {Object} Objet nettoyé
 */
export const sanitizeObject = (obj, fieldsToClean = []) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const cleaned = { ...obj };

  fieldsToClean.forEach(field => {
    if (field in cleaned) {
      cleaned[field] = sanitizeInput(cleaned[field], 'plain');
    }
  });

  return cleaned;
};

/**
 * ✅ BUG #5 FIX: Hook pour nettoyer le contenu avant affichage
 */
export const useSanitization = () => {
  return {
    sanitize: sanitizeInput,
    sanitizeURL,
    sanitizeObject,
    containsSuspicious: containsSuspiciousContent,
    // Aliases usuels
    escapeHTML: (str) => sanitizeInput(str, 'plain'),
    allowRichText: (str) => sanitizeInput(str, 'rich')
  };
};

/**
 * ✅ BUG #5 FIX: Composant React pour afficher du contenu sûr
 */
export const SafeHTML = ({ content, type = 'plain', className = '' }) => {
  const cleaned = sanitizeInput(content, type);
  
  // Pour du texte simple
  if (type === 'plain') {
    return <span className={className}>{cleaned}</span>;
  }

  // Pour du HTML riche (uniquement après nettoyage DOMPurify)
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
};

export default {
  sanitizeInput,
  sanitizeURL,
  sanitizeObject,
  containsSuspiciousContent,
  useSanitization,
  SafeHTML
};

