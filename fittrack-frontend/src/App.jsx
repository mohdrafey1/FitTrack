import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import FoodHistory from "./pages/FoodHistory";
import Analytics from "./pages/Analytics";
import { Toaster } from "react-hot-toast";

const AppContent = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <LoginPage />
                    )
                }
            />
            <Route
                path="/signup"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <SignupPage />
                    )
                }
            />
            <Route
                path="/dashboard"
                element={
                    isAuthenticated ? (
                        <DashboardPage />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/profile"
                element={
                    isAuthenticated ? (
                        <ProfilePage />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/history"
                element={
                    isAuthenticated ? (
                        <FoodHistory />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/analytics"
                element={
                    isAuthenticated ? (
                        <Analytics />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#363636",
                            color: "#fff",
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: "#10B981",
                                secondary: "#fff",
                            },
                        },
                        error: {
                            duration: 5000,
                            iconTheme: {
                                primary: "#EF4444",
                                secondary: "#fff",
                            },
                        },
                    }}
                />
            </Router>
        </AuthProvider>
    );
}

export default App;
