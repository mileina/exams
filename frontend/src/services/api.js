// src/services/api.js
import axios from 'axios';

// ✅ Configuration API flexible pour dev et production
const API_BASE_URL = (() => {
  // 1. Vérifier la variable d'env (priorité)
  if (process.env.REACT_APP_API_URL) {
    console.log('🔗 API URL from env:', process.env.REACT_APP_API_URL + '/api');
    return process.env.REACT_APP_API_URL + '/api';
  }
  // 2. En local (localhost:3000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔗 API URL (local dev):', 'http://localhost:5000/api');
    return 'http://localhost:5000/api';
  }
  // 3. Sur Render (exams1-uemk.onrender.com)
  if (window.location.hostname === 'exams1-1.onrender.com') {
    console.log('🔗 API URL (production):', 'https://exams1-uemk.onrender.com/api');
    return 'https://exams1-uemk.onrender.com/api';
  }
  // 4. Fallback pour autres domaines
  const apiUrl = `https://${window.location.hostname}/api`;
  console.log('🔗 API URL (production):', apiUrl);
  return apiUrl;
})();

export const fetchProducts = () => axios.get(`${API_BASE_URL}/products`);

export const createOrder = (orderData) => {
    console.log(`appel fonction createOrder avec orderData ${JSON.stringify(orderData)}`)
    const token = localStorage.getItem('token'); 
    console.log(`token is ${token}`)
    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('Full localStorage:', { token: localStorage.getItem('token'), username: localStorage.getItem('username'), role: localStorage.getItem('role') });
    
    return axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
            Authorization: token && token !== 'undefined' ? `Bearer ${token}` : '',
        },
    });
};
