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

// Food tracking API
export const foodAPI = {
    // Get today's food entry
    getToday: () => api.get("/api/food/today"),

    // Get food entry for specific date
    getByDate: (date) => api.get(`/api/food/date/${date}`),

    // Get food history
    getHistory: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return api.get(
            `/api/food/history${queryString ? `?${queryString}` : ""}`
        );
    },

    // Add food item
    addFood: (foodData) => api.post("/api/food/add", foodData),

    // Remove food item
    removeFood: (entryId) => api.delete(`/api/food/remove/${entryId}`),

    // Update water intake (add/subtract)
    updateWater: (amount) => api.post("/api/food/water", { amount }),

    // Set water intake (absolute value)
    setWater: (amount) => api.put("/api/food/water/set", { amount }),

    // Get analytics
    getAnalytics: (days = 7) => api.get(`/api/food/analytics?days=${days}`),
};

// Custom Foods API
export const customFoodAPI = {
    // Get user's custom foods
    getCustomFoods: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return api.get(
            `/api/custom-foods${queryString ? `?${queryString}` : ""}`
        );
    },

    // Get specific custom food
    getCustomFood: (id) => api.get(`/api/custom-foods/${id}`),

    // Create new custom food
    createCustomFood: (foodData) => api.post("/api/custom-foods", foodData),

    // Update custom food
    updateCustomFood: (id, foodData) =>
        api.put(`/api/custom-foods/${id}`, foodData),

    // Delete custom food
    deleteCustomFood: (id) => api.delete(`/api/custom-foods/${id}`),

    // Increment usage count
    useCustomFood: (id) => api.post(`/api/custom-foods/${id}/use`),

    // Get categories
    getCategories: () => api.get("/api/custom-foods/categories/list"),
};

export default api;
