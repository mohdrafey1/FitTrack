import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6001";

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) =>
        api.post("/api/auth/login", { email, password }),
    signup: (userData) => api.post("/api/auth/signup", userData),
    getMe: () => api.get("/api/auth/me"),
    updateProfile: (profileData) => api.put("/api/auth/profile", profileData),
};

// Health check
export const healthAPI = {
    check: () => api.get("/health"),
};

export default api;
