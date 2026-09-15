import axios from 'axios';

// Dynamic API URL based on hostname and environment variables
export const getApiUrl = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    // 1. Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    }

    // 2. Production domain (ardentsoft.uz)
    if (hostname.includes('ardentsoft.uz')) {
        return 'https://maktab.api.ardentsoft.uz/api';
    }

    // 3. Custom environment variable (if not localhost)
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
        return import.meta.env.VITE_API_URL;
    }

    // 4. Default Production API fallback
    return 'https://maktab.api.ardentsoft.uz/api';
};

export const API_URL = getApiUrl();
export const MEDIA_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    localStorage.setItem('accessToken', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
