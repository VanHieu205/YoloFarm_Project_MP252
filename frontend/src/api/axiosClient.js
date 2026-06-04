import axios from 'axios';

const axiosClient = axios.create({
    baseURL: "https://avenge-task-common.ngrok-free.dev", // Port của Backend
    headers: {
        'Content-Type': 'application/json',
        "ngrok-skip-browser-warning": "true",
    }
});

// Interceptor để gắn Token vào mỗi request nếu có
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor xử lý lỗi response
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Nếu token hết hạn hoặc invalid, xóa và redirect về login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
