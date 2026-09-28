import axios from 'axios';

// Domain va API URL lar mosligi (JSON xaritasi)
// Buni .env da VITE_API_DOMAIN_MAP orqali ham berish mumkin
const DEFAULT_DOMAIN_MAP = {
    'localhost': 'http://localhost:8000/api',
    '127.0.0.1': 'http://localhost:8000/api',
    'maktab.ardentsoft.uz': 'https://maktab.api.ardentsoft.uz/api',
    // Kelajakda qo'shiladigan yangi domenlar uchun:
    // 'boshqa-maktab.uz': 'https://api.boshqa-maktab.uz/api',
};

// Domen yoki Hostname bo'yicha to'g'ri API URL ni aniqlash
export const getApiUrl = () => {
    if (typeof window === 'undefined') {
        return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    }

    const hostname = window.location.hostname;
    const origin = window.location.origin;

    // 1. .env dagi VITE_API_DOMAIN_MAP (JSON formatda) tekshirish
    if (import.meta.env.VITE_API_DOMAIN_MAP) {
        try {
            const envMap = JSON.parse(import.meta.env.VITE_API_DOMAIN_MAP);
            if (envMap[hostname]) return envMap[hostname];
            if (envMap[origin]) return envMap[origin];
        } catch (e) {
            console.error('VITE_API_DOMAIN_MAP JSON parslashda xatolik:', e);
        }
    }

    // 2. Ichki DEFAULT_DOMAIN_MAP dan qidirish
    if (DEFAULT_DOMAIN_MAP[hostname]) {
        return DEFAULT_DOMAIN_MAP[hostname];
    }

    // 3. Subdomain yoki qisman moslikni tekshirish (masalan *.ardentsoft.uz)
    for (const [domainKey, apiUrl] of Object.entries(DEFAULT_DOMAIN_MAP)) {
        if (hostname.endsWith(domainKey)) {
            return apiUrl;
        }
    }

    // 4. .env dagi oddiy VITE_API_URL mavjud bo'lsa
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // 5. Standart fallback (ishlab chiqarish yoki localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000/api';
    }

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
