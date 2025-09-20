import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";

const Dashboard = () => {
    const { user } = useAuth();

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

                {/* Daily Targets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Calories */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daily Calories
                            </h3>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">
                                {formatNumber(user?.targetDailyCalories)}
                            </p>
                            <p className="text-sm text-gray-500">
                                calories per day
                            </p>
                        </div>
                    </div>

                    {/* Proteins */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daily Proteins
                            </h3>
                            <span className="text-2xl">🥩</span>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-red-600">
                                {formatNumber(user?.targetDailyProteins)}
                            </p>
                            <p className="text-sm text-gray-500">
                                grams per day
                            </p>
                        </div>
                    </div>

                    {/* Water */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daily Water
                            </h3>
                            <span className="text-2xl">💧</span>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">
                                {formatNumber(user?.targetDailyWater)}
                            </p>
                            <p className="text-sm text-gray-500">ml per day</p>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Profile Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Age
                            </p>
                            <p className="text-lg text-gray-900">
                                {user?.age || "Not specified"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Height
                            </p>
                            <p className="text-lg text-gray-900">
                                {user?.height
                                    ? `${user.height} cm`
                                    : "Not specified"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Gender
                            </p>
                            <p className="text-lg text-gray-900 capitalize">
                                {user?.gender || "Not specified"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Activity Level
                            </p>
                            <p className="text-lg text-gray-900 capitalize">
                                {user?.activityLevel?.replace("_", " ") ||
                                    "Not specified"}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">
                            Fitness Goal
                        </p>
                        <p className="text-lg text-gray-900 capitalize">
                            {user?.fitnessGoal?.replace("_", " ") ||
                                "Not specified"}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
