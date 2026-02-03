import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '';
if (!baseUrl.endsWith('/api') && baseUrl !== '') {
    baseUrl = baseUrl.replace(/\/$/, '') + '/api';
} else if (baseUrl === '') {
    baseUrl = '/api';
}

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
