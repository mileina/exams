// frontend/src/components/OrderForm.jsx
// BUG #8 FIX: Form reset après soumission

import React, { useState, useRef } from 'react';
import { useFormValidation } from '../utils/formValidation';
import { sanitizeInput } from '../utils/sanitization';
import logger from '../utils/logger';

/**
 * ✅ BUG #8 FIX: Formulaire de commande avec reset automatique
 */
export const OrderForm = ({ onSubmit, onSuccess, onError }) => {
  const formRef = useRef(null);

  // ✅ Utiliser le hook de validation
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues
  } = useFormValidation(
    {
      customerName: '',
      customerEmail: '',
      items: '',
      quantity: '1',
      address: '',
      notes: ''
    },
    {
      customerName: ['required', 'minLength:3'],
      customerEmail: ['required', 'email'],
      items: ['required'],
      quantity: ['required', 'number', 'min:1', 'max:100'],
      address: ['required', 'minLength:5'],
      notes: ['maxLength:500']
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Valider le formulaire
    const isValid = await validateForm();
    if (!isValid) {
      onError?.('Veuillez corriger les erreurs');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // ✅ Nettoyer les données avant envoi
      const cleanedData = {
        customerName: sanitizeInput(values.customerName, 'plain'),
        customerEmail: sanitizeInput(values.customerEmail, 'plain'),
        items: sanitizeInput(values.items, 'plain'),
        quantity: parseInt(values.quantity),
        address: sanitizeInput(values.address, 'plain'),
        notes: sanitizeInput(values.notes, 'plain')
      };

      // Appeler le callback
      const response = await onSubmit?.(cleanedData);

      setSubmitStatus({
        type: 'success',
        message: 'Commande créée avec succès!'
      });

      onSuccess?.(response);

      // ✅ BUG #8 FIX: Réinitialiser le formulaire après succès
      resetForm();
      
      // ✅ Aussi réinitialiser l'élément HTML
      if (formRef.current) {
        formRef.current.reset();
      }

      // ✅ Nettoyer le message après 3 secondes
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);

    } catch (error) {
      logger.error('Form submission error:', error);

      setSubmitStatus({
        type: 'error',
        message: error.message || 'Erreur lors de la soumission'
      });

      onError?.(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Handler pour réinitialiser manuellement
  const handleReset = () => {
    resetForm();
    if (formRef.current) {
      formRef.current.reset();
    }
    setSubmitStatus(null);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="order-form">
      {/* Messages de statut */}
      {submitStatus && (
        <div className={`form-alert alert-${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      {/* Nom du client */}
      <div className="form-group">
        <label htmlFor="customerName">Nom du client *</label>
        <input
          id="customerName"
          type="text"
          name="customerName"
          value={values.customerName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Jean Dupont"
          className={touched.customerName && errors.customerName ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {touched.customerName && errors.customerName && (
          <span className="error-message">{errors.customerName}</span>
        )}
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="customerEmail">Email *</label>
        <input
          id="customerEmail"
          type="email"
          name="customerEmail"
          value={values.customerEmail}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="jean@example.com"
          className={touched.customerEmail && errors.customerEmail ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {touched.customerEmail && errors.customerEmail && (
          <span className="error-message">{errors.customerEmail}</span>
        )}
      </div>

      {/* Produits */}
      <div className="form-group">
        <label htmlFor="items">Produits *</label>
        <textarea
          id="items"
          name="items"
          value={values.items}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Décrivez les produits..."
          className={touched.items && errors.items ? 'input-error' : ''}
          disabled={isSubmitting}
          rows="3"
        />
        {touched.items && errors.items && (
          <span className="error-message">{errors.items}</span>
        )}
      </div>

      {/* Quantité */}
      <div className="form-group">
        <label htmlFor="quantity">Quantité *</label>
        <input
          id="quantity"
          type="number"
          name="quantity"
          value={values.quantity}
          onChange={handleChange}
          onBlur={handleBlur}
          min="1"
          max="100"
          className={touched.quantity && errors.quantity ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {touched.quantity && errors.quantity && (
          <span className="error-message">{errors.quantity}</span>
        )}
      </div>

      {/* Adresse */}
      <div className="form-group">
        <label htmlFor="address">Adresse *</label>
        <textarea
          id="address"
          name="address"
          value={values.address}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="123 Rue de Paris, 75000 Paris"
          className={touched.address && errors.address ? 'input-error' : ''}
          disabled={isSubmitting}
          rows="3"
        />
        {touched.address && errors.address && (
          <span className="error-message">{errors.address}</span>
        )}
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes">Notes (optionnel)</label>
        <textarea
          id="notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Notes additionnelles..."
          className={touched.notes && errors.notes ? 'input-error' : ''}
          disabled={isSubmitting}
          rows="2"
        />
        {touched.notes && errors.notes && (
          <span className="error-message">{errors.notes}</span>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Créer la commande'}
        </button>

        {/* ✅ BUG #8 FIX: Bouton reset */}
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
};

export default OrderForm;

