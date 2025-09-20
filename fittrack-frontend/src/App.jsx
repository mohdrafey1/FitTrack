import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Dashboard from "./components/Dashboard";
import { Toaster } from "react-hot-toast";

const AppContent = () => {
    const { isAuthenticated, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

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

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {isLogin ? (
                <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
                <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
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
        </AuthProvider>
    );
}

export default App;
