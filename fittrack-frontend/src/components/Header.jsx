import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const Header = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully!");
    };

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    FT
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                FitTrack
                            </h1>
                        </div>
                    </div>

                    {/* User Info and Actions */}
                    <div className="flex items-center space-x-4">
                        {/* User Profile Info */}
                        <div className="hidden sm:flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium text-sm">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                    {user?.username}
                                </p>
                                <p className="text-gray-500">
                                    {user?.fitnessGoal?.replace("_", " ")}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <span>⚖️</span>
                                <span>{user?.currentWeight}kg</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span>🎯</span>
                                <span>{user?.targetWeight}kg</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
