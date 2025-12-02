import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ShippingMethodSelection from '../components/ShippingMethodSelection';
import PaymentMethodSelection from '../components/handlePaymentChange';
import ShippingAddress from '../components/ShippingAddress';


const ShippingPayment = () => {
  const navigate = useNavigate();
  const { shippingAddress, shippingMethod, paymentMethod } = useCart();
  
  // Vérifier les champs manquants
  const missingFields = [];
  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
    missingFields.push('adresse de livraison');
  }
  if (!shippingMethod || shippingMethod === '') {
    missingFields.push('méthode de livraison');
  }
  if (!paymentMethod || paymentMethod === '') {
    missingFields.push('mode de paiement');
  }

  const handleSubmitOrder = () => {
    if (missingFields.length > 0) {
      alert(`Veuillez remplir les champs suivants :\n${missingFields.map(f => `• ${f}`).join('\n')}`);
      return;
    }
    navigate('/order');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Livraison et Paiement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <ShippingAddress /> 
        </div>
        <div>
          <ShippingMethodSelection />
          <PaymentMethodSelection />
        </div>
      </div>
      <hr className="my-4" />
      
      {/* Message d'erreur si champs manquants */}
      {missingFields.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Veuillez compléter votre commande :</p>
          <ul className="list-disc list-inside">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div>
        <button
          onClick={handleSubmitOrder}
          disabled={missingFields.length > 0}
          className={`px-4 py-2 rounded ${
            missingFields.length > 0
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Passer une commande
        </button>
      </div>
    </div>
  );
};

export default ShippingPayment;
