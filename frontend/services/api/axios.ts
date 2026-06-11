import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    "withCredentials": true
  },
});

const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip logout if it's the login request itself failing
    if (originalRequest.url === '/auth/login') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const refreshResponse = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const { access_token, refresh_token } = refreshResponse.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      logout();
    }

    return Promise.reject(error);
  }
);

export default api;
