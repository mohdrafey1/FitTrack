import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on app start
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data.user);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    localStorage.removeItem("token");
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser(userData);

            toast.success(`Welcome back, ${userData.username}!`);
            return { success: true };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Login failed";
            toast.error(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await authAPI.signup(userData);
            const { token: newToken, user: newUser } = response.data;

            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser(newUser);

            toast.success(
                `Welcome to FitTrack, ${newUser.username}! Your account has been created successfully.`
            );
            return { success: true };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Signup failed";
            toast.error(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await authAPI.updateProfile(profileData);
            setUser(response.data.user);
            toast.success("Profile updated successfully!");
            return { success: true };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "Profile update failed";
            toast.error(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
