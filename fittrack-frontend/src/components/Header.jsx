import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
        toast.success("Logged out successfully!");
        setShowDropdown(false);
    };

    const handleProfileClick = () => {
        navigate("/profile");
        setShowDropdown(false);
    };

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center">
                        <Link
                            to="/dashboard"
                            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    FT
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                FitTrack
                            </h1>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/dashboard"
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                location.pathname === "/dashboard"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/profile"
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                location.pathname === "/profile"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            }`}
                        >
                            Profile
                        </Link>
                    </nav>

                    {/* User Info and Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Quick Stats */}
                        <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <span>⚖️</span>
                                <span>{user?.currentWeight || "--"}kg</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span>🎯</span>
                                <span>{user?.targetWeight || "--"}kg</span>
                            </div>
                        </div>

                        {/* User Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {user?.username
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="font-medium text-gray-900 text-sm">
                                        {user?.username}
                                    </p>
                                    <p className="text-gray-500 text-xs capitalize">
                                        {user?.fitnessGoal?.replace("_", " ") ||
                                            "Member"}
                                    </p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    {/* Mobile Navigation Links */}
                                    <div className="md:hidden">
                                        <Link
                                            to="/dashboard"
                                            onClick={() =>
                                                setShowDropdown(false)
                                            }
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                                />
                                            </svg>
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/profile"
                                            onClick={() =>
                                                setShowDropdown(false)
                                            }
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            Profile
                                        </Link>
                                        <div className="border-t border-gray-200 my-1"></div>
                                    </div>

                                    {/* Profile Option */}
                                    <button
                                        onClick={handleProfileClick}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        Edit Profile
                                    </button>

                                    {/* Settings Option */}
                                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        Settings
                                    </button>

                                    <div className="border-t border-gray-200 my-1"></div>

                                    {/* Logout Option */}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Close dropdown when clicking outside */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </header>
    );
};

export default Header;
