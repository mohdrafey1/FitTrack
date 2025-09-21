import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { foodAPI } from "../services/api";
import AddEntryModal from "./AddEntryModal";
import {
    Flame,
    Beef,
    Droplets,
    Scale,
    Target,
    TrendingUp,
    TrendingDown,
    Activity,
    Plus,
    History,
    BarChart3,
    UtensilsCrossed,
    Trophy,
    Calendar,
    User,
    Zap,
} from "lucide-react";

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [todayEntry, setTodayEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState("food");

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

    const formatNumber = (num) => {
        return num ? num.toLocaleString() : "0";
    };

    const getWeightDifference = () => {
        if (user?.targetWeight && user?.currentWeight) {
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

    const getProgress = (consumed, target) => {
        if (!target || target === 0) return 0;
        return Math.min((consumed / target) * 100, 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "from-emerald-500 to-green-500";
        if (percentage >= 75) return "from-amber-400 to-orange-500";
        if (percentage >= 50) return "from-orange-400 to-red-400";
        return "from-red-400 to-pink-500";
    };

    const getBMICategory = (bmi) => {
        if (bmi < 18.5) return { text: "Underweight", color: "text-blue-600" };
        if (bmi < 25) return { text: "Normal", color: "text-green-600" };
        if (bmi < 30) return { text: "Overweight", color: "text-orange-600" };
        return { text: "Obese", color: "text-red-600" };
    };

    const ProgressCard = ({
        title,
        icon: Icon,
        consumed,
        target,
        unit,
        gradient,
    }) => {
        const percentage = getProgress(consumed, target);
        const remaining = Math.max((target || 0) - (consumed || 0), 0);

        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center space-x-2 md:space-x-3">
                        <div
                            className={`p-2 md:p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                        >
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-800">
                            {title}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                            {formatNumber(consumed || 0)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">
                            of {formatNumber(target || 0)} {unit}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3 md:mb-4">
                    <div className="w-full bg-gray-100 rounded-full h-2 md:h-3 shadow-inner">
                        <div
                            className={`h-2 md:h-3 rounded-full bg-gradient-to-r ${getProgressColor(
                                percentage
                            )} transition-all duration-500 shadow-sm`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs md:text-sm font-medium text-gray-600">
                            {percentage.toFixed(1)}%
                        </span>
                        {percentage >= 100 ? (
                            <div className="flex items-center space-x-1">
                                <Trophy className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                                <span className="text-xs md:text-sm text-emerald-600 font-medium">
                                    Goal achieved!
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs md:text-sm text-gray-500">
                                {formatNumber(remaining)} {unit} left
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
        color,
        bgColor,
    }) => (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                        {title}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs md:text-sm text-gray-500">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 md:p-3 rounded-xl ${bgColor} shadow-lg`}>
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
                </div>
            </div>
        </div>
    );

    const QuickActionButton = ({ onClick, gradient, icon: Icon, label }) => (
        <button
            onClick={onClick}
            className={`bg-gradient-to-r ${gradient} text-white py-3 md:py-4 px-4 md:px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 md:space-x-3 font-medium text-sm md:text-base`}
        >
            <Icon className="w-4 h-4 md:w-5 md:h-5" />
            <span>{label}</span>
        </button>
    );

    const bmiCategory = getBMICategory(user?.bmi);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Today's Progress */}
                <div className="mb-6 md:mb-8">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center space-x-2">
                        <Activity className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        <span>Today's Progress</span>
                    </h3>

                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                            <ProgressCard
                                title="Calories"
                                icon={Flame}
                                consumed={todayEntry?.totalCalories || 0}
                                target={user?.targetDailyCalories || 2000}
                                unit="cal"
                                gradient="from-orange-500 to-red-500"
                            />
                            <ProgressCard
                                title="Protein"
                                icon={Beef}
                                consumed={todayEntry?.totalProtein || 0}
                                target={user?.targetDailyProteins || 150}
                                unit="g"
                                gradient="from-red-500 to-pink-500"
                            />
                            <ProgressCard
                                title="Water"
                                icon={Droplets}
                                consumed={todayEntry?.water || 0}
                                target={user?.targetDailyWater || 2500}
                                unit="ml"
                                gradient="from-blue-500 to-cyan-500"
                            />
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mb-6 md:mb-8">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center space-x-2">
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                        <span>Quick Actions</span>
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <QuickActionButton
                            onClick={() => {
                                setModalType("food");
                                setShowAddModal(true);
                            }}
                            gradient="from-orange-500 to-red-500"
                            icon={UtensilsCrossed}
                            label="Add Food"
                        />
                        <QuickActionButton
                            onClick={() => {
                                setModalType("water");
                                setShowAddModal(true);
                            }}
                            gradient="from-blue-500 to-cyan-500"
                            icon={Droplets}
                            label="Add Water"
                        />
                        <QuickActionButton
                            onClick={() => navigate("/history")}
                            gradient="from-emerald-500 to-green-500"
                            icon={History}
                            label="History"
                        />
                        <QuickActionButton
                            onClick={() => navigate("/analytics")}
                            gradient="from-purple-500 to-indigo-500"
                            icon={BarChart3}
                            label="Analytics"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <StatCard
                        title="Current Weight"
                        value={
                            user?.currentWeight
                                ? `${user.currentWeight} kg`
                                : "N/A"
                        }
                        icon={Scale}
                        color="text-blue-600"
                        bgColor="bg-blue-100"
                    />
                    <StatCard
                        title="Target Weight"
                        value={
                            user?.targetWeight
                                ? `${user.targetWeight} kg`
                                : "N/A"
                        }
                        icon={Target}
                        color="text-emerald-600"
                        bgColor="bg-emerald-100"
                    />
                    <StatCard
                        title="Weight Goal"
                        value={weightDiff ? `${weightDiff.value} kg` : "N/A"}
                        subtitle={
                            weightDiff
                                ? weightDiff.isLoss
                                    ? "to lose"
                                    : "to gain"
                                : ""
                        }
                        icon={weightDiff?.isLoss ? TrendingDown : TrendingUp}
                        color={
                            weightDiff?.isLoss
                                ? "text-red-600"
                                : "text-amber-600"
                        }
                        bgColor={
                            weightDiff?.isLoss ? "bg-red-100" : "bg-amber-100"
                        }
                    />
                    <StatCard
                        title="BMI"
                        value={user?.bmi || "N/A"}
                        subtitle={user?.bmi ? bmiCategory.text : ""}
                        icon={Activity}
                        color="text-purple-600"
                        bgColor="bg-purple-100"
                    />
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
