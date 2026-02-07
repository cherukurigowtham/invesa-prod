import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '';
if (!baseUrl.endsWith('/api') && baseUrl !== '') {
    baseUrl = baseUrl.replace(/\/$/, '') + '/api';
} else if (baseUrl === '') {
    baseUrl = 'https://invesa-service.onrender.com/api';
}

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

console.log('API Base URL:', baseUrl);

api.interceptors.request.use((config) => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
        try {
            const user = JSON.parse(rawUser);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch {
            // Ignore invalid localStorage values
        }
    }
    return config;
});

export default api;
