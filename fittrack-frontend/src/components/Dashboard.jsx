import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { foodAPI } from "../services/api";
import AddEntryModal from "./AddEntryModal";

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [todayEntry, setTodayEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState("food"); // "food" or "water"

    useEffect(() => {
        const fetchTodayData = async () => {
            try {
                const response = await foodAPI.getToday();
                if (response.data.success) {
                    setTodayEntry(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching today's data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTodayData();
        }
    }, [user]);

    const handleAddEntry = (updatedEntry) => {
        setTodayEntry(updatedEntry);
    };

    const openFoodModal = () => {
        setModalType("food");
        setShowAddModal(true);
    };

    const openWaterModal = () => {
        setModalType("water");
        setShowAddModal(true);
    };

    const formatNumber = (num) => {
        return num ? num.toLocaleString() : "N/A";
    };

    const getWeightDifference = () => {
        if (user?.currentWeight && user?.targetWeight) {
            const difference = user.targetWeight - user.currentWeight;
            return {
                value: Math.abs(difference).toFixed(1),
                isGain: difference > 0,
                isLoss: difference < 0,
            };
        }
        return null;
    };

    const weightDiff = getWeightDifference();

    // Progress calculation helpers
    const getProgress = (consumed, target) => {
        if (!target || target === 0) return 0;
        return Math.min((consumed / target) * 100, 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "bg-green-500";
        if (percentage >= 75) return "bg-yellow-500";
        if (percentage >= 50) return "bg-orange-500";
        return "bg-red-500";
    };

    // Progress Slider Component
    const ProgressSlider = ({ title, icon, consumed, target, unit, color }) => {
        const percentage = getProgress(consumed, target);
        const progressColor = getProgressColor(percentage);

        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <span className="text-2xl">{icon}</span>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span
                            className={`text-2xl font-bold text-${color}-600`}
                        >
                            {formatNumber(consumed || 0)}
                        </span>
                        <span className="text-sm text-gray-500">
                            / {formatNumber(target || 0)} {unit}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all duration-300 ${progressColor}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">
                            {percentage.toFixed(1)}% completed
                        </span>
                        {percentage >= 100 && (
                            <span className="text-sm text-green-600 font-medium">
                                ✓ Goal achieved!
                            </span>
                        )}
                    </div>
                </div>

                {percentage < 100 && (
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">
                            {formatNumber((target || 0) - (consumed || 0))}{" "}
                            {unit} remaining
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to your fitness journey!
                    </h2>
                    <p className="text-gray-600">
                        Track your progress and achieve your fitness goals.
                    </p>
                </div>

                {/* Daily Progress Tracking */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Today's Progress
                    </h3>
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-lg shadow p-6"
                                >
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ProgressSlider
                                title="Calories"
                                icon="🔥"
                                consumed={todayEntry?.totalCalories || 0}
                                target={user?.targetDailyCalories || 2000}
                                unit="cal"
                                color="orange"
                            />
                            <ProgressSlider
                                title="Protein"
                                icon="🥩"
                                consumed={todayEntry?.totalProtein || 0}
                                target={user?.targetDailyProteins || 150}
                                unit="g"
                                color="red"
                            />
                            <ProgressSlider
                                title="Water"
                                icon="💧"
                                consumed={todayEntry?.water || 0}
                                target={user?.targetDailyWater || 2000}
                                unit="ml"
                                color="blue"
                            />
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={openFoodModal}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition duration-200 flex items-center justify-center space-x-2"
                        >
                            <span>🍽️</span>
                            <span>Add Food</span>
                        </button>
                        <button
                            onClick={openWaterModal}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 flex items-center justify-center space-x-2"
                        >
                            <span>💧</span>
                            <span>Add Water</span>
                        </button>
                        <button
                            onClick={() => navigate("/history")}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200 flex items-center justify-center space-x-2"
                        >
                            <span>📊</span>
                            <span>View History</span>
                        </button>
                        <button
                            onClick={() => navigate("/analytics")}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition duration-200 flex items-center justify-center space-x-2"
                        >
                            <span>📈</span>
                            <span>Analytics</span>
                        </button>
                    </div>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Current Weight */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                        ⚖️
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Current Weight
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {user?.currentWeight
                                        ? `${user.currentWeight} kg`
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Target Weight */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-semibold">
                                        🎯
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Target Weight
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {user?.targetWeight
                                        ? `${user.targetWeight} kg`
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Weight Difference */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        weightDiff?.isLoss
                                            ? "bg-red-100"
                                            : "bg-yellow-100"
                                    }`}
                                >
                                    <span
                                        className={`font-semibold ${
                                            weightDiff?.isLoss
                                                ? "text-red-600"
                                                : "text-yellow-600"
                                        }`}
                                    >
                                        {weightDiff?.isLoss ? "📉" : "📈"}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    Weight Difference
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {weightDiff
                                        ? `${weightDiff.value} kg`
                                        : "N/A"}
                                </p>
                                {weightDiff && (
                                    <p className="text-xs text-gray-500">
                                        {weightDiff.isLoss
                                            ? "to lose"
                                            : "to gain"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BMI */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold">
                                        📊
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">
                                    BMI
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {user?.bmi || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Entry Modal */}
            <AddEntryModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddEntry}
                type={modalType}
            />
        </div>
    );
};

export default Dashboard;
