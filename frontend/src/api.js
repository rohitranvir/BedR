import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
});

// Response interceptor
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status >= 500) {
      window.alert("Server error, please try again");
    } else {
      console.error("API Error:", err.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
