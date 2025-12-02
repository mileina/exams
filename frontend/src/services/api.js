// src/services/api.js
import axios from 'axios';

// ✅ Configuration API flexible pour dev et production
const API_BASE_URL = (() => {
  // 1. Vérifier la variable d'env (priorité)
  if (process.env.REACT_APP_API_URL) {
    console.log('🔗 API URL from env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Si REACT_APP_API_URL est défini, l'utiliser
  if (process.env.REACT_APP_API_URL) {
    console.log('🔗 API URL (env):', process.env.REACT_APP_API_URL + '/api');
    return process.env.REACT_APP_API_URL + '/api';
  }
  // 3. En local (localhost:3000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔗 API URL (local dev):', 'http://localhost:5000/api');
    return 'http://localhost:5000/api';
  }
  // 4. Sur Render (déduire du hostname du frontend)
  // Frontend: https://exams1-1.onrender.com → Backend: https://exams-backend.onrender.com
  const backendUrl = window.location.hostname.replace('exams1-1', 'exams-backend');
  const apiUrl = `https://${backendUrl}/api`;
  console.log('🔗 API URL (production):', apiUrl);
  return apiUrl;
})();

export const fetchProducts = () => axios.get(`${API_BASE_URL}/products`);

export const createOrder = (orderData) => {
    console.log(`appel fonction createOrder avec orderData ${JSON.stringify(orderData)}`)
    const token = localStorage.getItem('token'); // Token de connexion
    console.log(`token is ${token}`)
    return axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
