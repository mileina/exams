// frontend/src/utils/formValidation.js
// BUG #1 & #8 FIX: Validation complète et gestion des erreurs

export const validators = {
  // Validation email
  email: (value) => {
    if (!value) return 'Email requis';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) return 'Format email invalide';
    return null;
  },

  // Validation mot de passe
  password: (value, options = {}) => {
    const { minLength = 8 } = options;
    if (!value) return 'Mot de passe requis';
    if (value.length < minLength) return `Minimum ${minLength} caractères`;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase) return 'Doit contenir au moins une majuscule';
    if (!hasLowerCase) return 'Doit contenir au moins une minuscule';
    if (!hasNumber) return 'Doit contenir au moins un chiffre';
    if (!hasSpecial) return 'Doit contenir au moins un caractère spécial';

    return null;
  },

  // Confirmation password
  confirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return 'Confirmez le mot de passe';
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
    return null;
  },

  // Validation username
  username: (value) => {
    if (!value) return 'Nom d\'utilisateur requis';
    if (value.length < 3) return 'Minimum 3 caractères';
    if (value.length > 30) return 'Maximum 30 caractères';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Caractères autorisés: lettres, chiffres, _, -';
    }
    return null;
  },

  // Validation texte
  text: (value, options = {}) => {
    const { minLength = 1, maxLength = 255, required = true } = options;

    if (!value && required) return 'Champ requis';
    if (value && value.length < minLength) return `Minimum ${minLength} caractères`;
    if (value && value.length > maxLength) return `Maximum ${maxLength} caractères`;
    return null;
  },

  // Validation URL
  url: (value) => {
    if (!value) return 'URL requise';
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL invalide';
    }
  },

  // Validation nombre
  number: (value, options = {}) => {
    const { min = 0, max = Infinity } = options;
    if (value === '' || value === null) return 'Nombre requis';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Doit être un nombre';
    if (num < min) return `Minimum ${min}`;
    if (num > max) return `Maximum ${max}`;
    return null;
  },

  // Validation date
  date: (value) => {
    if (!value) return 'Date requise';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Date invalide';
    return null;
  }
};

// Helper pour valider les formulaires
export const validateForm = (formData, schema) => {
  const errors = {};

  Object.keys(schema).forEach(field => {
    const validator = schema[field];
    const value = formData[field];

    if (typeof validator === 'function') {
      const error = validator(value, formData);
      if (error) {
        errors[field] = error;
      }
    } else if (Array.isArray(validator)) {
      // Multiple validators
      for (const v of validator) {
        const error = v(value, formData);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Hook pour formulaires avec validation
export const useFormValidation = (initialValues, validationSchema, onSubmit) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name, value) => {
    const validator = validationSchema[name];
    if (!validator) return null;

    if (typeof validator === 'function') {
      return validator(value, values);
    } else if (Array.isArray(validator)) {
      for (const v of validator) {
        const error = v(value, values);
        if (error) return error;
      }
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Valider au changement si le champ a été touché
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider tous les champs
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      // Réinitialiser après succès
      setValues(initialValues);
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
      // Gestion d'erreur
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue: (name, value) => {
      setValues(prev => ({ ...prev, [name]: value }));
    },
    setFieldTouched: (name, isTouched) => {
      setTouched(prev => ({ ...prev, [name]: isTouched }));
    }
  };
};

export default validators;

