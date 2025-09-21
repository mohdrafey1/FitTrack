import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import { foodAPI } from "../services/api";
import {
    TrendingUp,
    Calendar,
    Target,
    Award,
    Flame,
    Droplets,
    Users,
    Activity,
    BarChart3,
    ChevronDown,
    Trophy,
    Zap,
    Heart,
    Filter,
} from "lucide-react";

const Analytics = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState("7");

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await foodAPI.getAnalytics(
                    parseInt(selectedPeriod)
                );
                if (response.data.success) {
                    setAnalytics(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedPeriod]);

    // UTC-consistent date formatting for consistency
    const formatDateUTC = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        });
    };

    const getGoalAchievementColor = (percentage) => {
        if (percentage >= 100) return "text-emerald-600 bg-emerald-50";
        if (percentage >= 75) return "text-amber-600 bg-amber-50";
        if (percentage >= 50) return "text-orange-600 bg-orange-50";
        return "text-red-600 bg-red-50";
    };

    const StatCard = ({
        title,
        value,
        unit,
        target,
        icon: Icon,
        color,
        bgColor,
    }) => {
        const percentage = target ? Math.round((value / target) * 100) : 0;

        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h3 className="text-xs md:text-sm font-medium text-gray-600 truncate">
                        {title}
                    </h3>
                    <div
                        className={`p-1.5 md:p-2 rounded-lg ${
                            bgColor || "bg-gray-100"
                        }`}
                    >
                        <Icon
                            className={`w-3 h-3 md:w-4 md:h-4 ${
                                color || "text-gray-600"
                            }`}
                        />
                    </div>
                </div>
                <div className="space-y-1 md:space-y-2">
                    <div className="flex items-baseline space-x-1">
                        <span
                            className={`text-lg md:text-2xl font-bold ${
                                color || "text-gray-900"
                            }`}
                        >
                            {typeof value === "number"
                                ? value.toLocaleString()
                                : value}
                        </span>
                        <span className="text-xs md:text-sm text-gray-500">
                            {unit}
                        </span>
                    </div>
                    {target && (
                        <>
                            <div className="text-xs text-gray-500">
                                Target: {target.toLocaleString()}
                                {unit}
                            </div>
                            <div
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGoalAchievementColor(
                                    percentage
                                )}`}
                            >
                                <Target className="w-3 h-3 mr-1" />
                                {percentage}%
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const TrendChart = ({ data, title, dataKey, unit, icon: Icon }) => {
        // Debug: Log the data being passed
        console.log(`TrendChart ${title}:`, { data, dataKey, unit });

        // Ensure we have data
        if (!data || data.length === 0) {
            return (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center space-x-2">
                            {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                            <span>{title}</span>
                        </h3>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="relative h-32 md:h-48 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                            No data available
                        </span>
                    </div>
                </div>
            );
        }

        const chartData = data.slice(-7); // Last 7 entries for mobile
        const values = chartData.map((item) => item[dataKey] || 0);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        console.log(`${title} values:`, { values, maxValue, minValue });

        // Better range calculation - ensure minimum range for better visualization
        const range = maxValue - minValue || Math.max(maxValue * 0.1, 1);

        // Dynamic color based on dataKey
        const getChartColor = (dataKey) => {
            switch (dataKey) {
                case "calories":
                    return "from-orange-400 to-red-500";
                case "protein":
                    return "from-red-400 to-pink-500";
                case "water":
                    return "from-blue-400 to-cyan-500";
                case "foodCount":
                    return "from-green-400 to-emerald-500";
                default:
                    return "from-indigo-400 to-purple-500";
            }
        };

        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center space-x-2">
                        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                        <span>{title}</span>
                    </h3>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="relative h-32 md:h-48">
                    <div className="absolute inset-0 flex items-end justify-between px-2">
                        {chartData.map((item, index) => {
                            const value = item[dataKey] || 0;
                            // Better height calculation with minimum height
                            let height;
                            if (maxValue === minValue) {
                                height = 70; // Show 50% height when all values are the same
                            } else {
                                height = ((value - minValue) / range) * 85 + 20; // 10-95% range
                            }

                            console.log(`${title} bar ${index}:`, {
                                value,
                                height,
                            });

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col items-center flex-1 px-0.5 md:px-1"
                                >
                                    <div
                                        className={`bg-gradient-to-t ${getChartColor(
                                            dataKey
                                        )} rounded-t-lg transition-all duration-700 ease-out mb-1 md:mb-2 relative group cursor-pointer shadow-sm hover:shadow-md`}
                                        style={{
                                            height: `${Math.max(height, 12)}%`,
                                            width: "75%",
                                            minHeight: "8px",
                                        }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                            <div className="text-center">
                                                <div className="font-semibold">
                                                    {value.toLocaleString()}
                                                    {unit}
                                                </div>
                                                <div className="text-gray-300 text-xs">
                                                    {formatDateUTC(item.date)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left truncate max-w-6">
                                        {formatDateUTC(item.date)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-1">
                        <span className="bg-white/80 px-1 rounded">
                            {Math.round(maxValue)}
                        </span>
                        <span className="hidden md:block bg-white/80 px-1 rounded">
                            {Math.round((maxValue + minValue) / 2)}
                        </span>
                        <span className="bg-white/80 px-1 rounded">
                            {Math.round(minValue)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const StreakDisplay = ({ entries }) => {
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Calculate streaks (days with any food logged)
        const sortedEntries = [...entries].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        for (let i = 0; i < sortedEntries.length; i++) {
            if (sortedEntries[i].foodCount > 0) {
                tempStreak++;
                if (i === 0) currentStreak = tempStreak;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                <div className="flex items-center space-x-2 mb-3 md:mb-4">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    <h3 className="text-sm md:text-base font-semibold text-gray-900">
                        Tracking Streaks
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="text-center p-2 md:p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                        <div className="flex items-center justify-center mb-1">
                            <Activity className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-1" />
                            <span className="text-lg md:text-2xl font-bold text-orange-600">
                                {currentStreak}
                            </span>
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-700">
                            Current
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                    </div>
                    <div className="text-center p-2 md:p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                        <div className="flex items-center justify-center mb-1">
                            <Trophy className="w-3 h-3 md:w-4 md:h-4 text-emerald-500 mr-1" />
                            <span className="text-lg md:text-2xl font-bold text-emerald-600">
                                {longestStreak}
                            </span>
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-700">
                            Best
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Header />

            <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6">
                {/* Header */}
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">
                                Analytics
                            </h1>
                            <p className="text-xs md:text-sm text-gray-600">
                                Track your nutrition journey
                            </p>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="mb-4 md:mb-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <label className="text-xs md:text-sm font-medium text-gray-700">
                                    Period:
                                </label>
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) =>
                                        setSelectedPeriod(e.target.value)
                                    }
                                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 md:py-2 pr-8 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="7">7 days</option>
                                    <option value="14">14 days</option>
                                    <option value="30">30 days</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 md:space-y-6">
                        {/* Loading stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white/80 rounded-xl p-3 md:p-4"
                                >
                                    <div className="animate-pulse">
                                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-2 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Loading charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white/80 rounded-xl p-3 md:p-4"
                                >
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded mb-3"></div>
                                        <div className="h-32 md:h-48 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : analytics ? (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                            <StatCard
                                title="Avg Calories"
                                value={analytics.summary.avgCalories}
                                unit="cal"
                                target={user?.targetDailyCalories}
                                icon={Flame}
                                color="text-orange-600"
                                bgColor="bg-orange-100"
                            />
                            <StatCard
                                title="Avg Protein"
                                value={analytics.summary.avgProtein}
                                unit="g"
                                target={user?.targetDailyProteins}
                                icon={Heart}
                                color="text-red-600"
                                bgColor="bg-red-100"
                            />
                            <StatCard
                                title="Avg Water"
                                value={analytics.summary.avgWater}
                                unit="ml"
                                target={user?.targetDailyWater}
                                icon={Droplets}
                                color="text-blue-600"
                                bgColor="bg-blue-100"
                            />
                            <StatCard
                                title="Active Days"
                                value={analytics.summary.totalEntries}
                                unit={`/${analytics.period.days}`}
                                icon={Calendar}
                                color="text-emerald-600"
                                bgColor="bg-emerald-100"
                            />
                        </div>

                        {/* Best Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                            {analytics.bestDays.calories && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                                    <div className="flex items-center space-x-2 mb-2 md:mb-3">
                                        <Award className="w-4 h-4 text-orange-500" />
                                        <h3 className="text-xs md:text-sm font-semibold text-gray-900">
                                            Best Calorie Day
                                        </h3>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg md:text-2xl font-bold text-orange-600 mb-1">
                                            {analytics.bestDays.calories.value}
                                            <span className="text-xs md:text-sm text-gray-500 ml-1">
                                                cal
                                            </span>
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600">
                                            {formatDateUTC(
                                                analytics.bestDays.calories.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analytics.bestDays.protein && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                                    <div className="flex items-center space-x-2 mb-2 md:mb-3">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        <h3 className="text-xs md:text-sm font-semibold text-gray-900">
                                            Best Protein Day
                                        </h3>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg md:text-2xl font-bold text-red-600 mb-1">
                                            {analytics.bestDays.protein.value}
                                            <span className="text-xs md:text-sm text-gray-500 ml-1">
                                                g
                                            </span>
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600">
                                            {formatDateUTC(
                                                analytics.bestDays.protein.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analytics.bestDays.water && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                                    <div className="flex items-center space-x-2 mb-2 md:mb-3">
                                        <Droplets className="w-4 h-4 text-blue-500" />
                                        <h3 className="text-xs md:text-sm font-semibold text-gray-900">
                                            Best Hydration Day
                                        </h3>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg md:text-2xl font-bold text-blue-600 mb-1">
                                            {analytics.bestDays.water.value}
                                            <span className="text-xs md:text-sm text-gray-500 ml-1">
                                                ml
                                            </span>
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600">
                                            {formatDateUTC(
                                                analytics.bestDays.water.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Streak Information */}
                        <div className="mb-4 md:mb-6">
                            <StreakDisplay entries={analytics.entries} />
                        </div>

                        {/* Trend Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                            <TrendChart
                                data={analytics.entries}
                                title="Calories"
                                dataKey="calories"
                                unit="cal"
                                icon={Flame}
                            />
                            <TrendChart
                                data={analytics.entries}
                                title="Protein"
                                dataKey="protein"
                                unit="g"
                                icon={Heart}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                            <TrendChart
                                data={analytics.entries}
                                title="Water Intake"
                                dataKey="water"
                                unit="ml"
                                icon={Droplets}
                            />
                            <TrendChart
                                data={analytics.entries}
                                title="Food Items"
                                dataKey="foodCount"
                                unit=" items"
                                icon={Users}
                            />
                        </div>

                        {/* Insights */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                            <div className="flex items-center space-x-2 mb-3 md:mb-4">
                                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                                    Key Insights
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs md:text-sm font-medium text-gray-900 flex items-center space-x-1">
                                        <Activity className="w-3 h-3 md:w-4 md:h-4" />
                                        <span>Nutrition Summary</span>
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-gray-600">
                                                Total Calories:
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.summary.totalCalories.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-gray-600">
                                                Total Protein:
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.summary.totalProtein.toLocaleString()}
                                                g
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-gray-600">
                                                Total Water:
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.summary.totalWater.toLocaleString()}
                                                ml
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs md:text-sm">
                                            <span className="text-gray-600">
                                                Active Days:
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.summary.totalEntries}
                                                /{analytics.period.days}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs md:text-sm font-medium text-gray-900 flex items-center space-x-1">
                                        <Target className="w-3 h-3 md:w-4 md:h-4" />
                                        <span>Goal Achievement</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {user?.targetDailyCalories && (
                                            <div>
                                                <div className="flex justify-between items-center text-xs md:text-sm mb-1">
                                                    <span className="text-gray-600">
                                                        Calories
                                                    </span>
                                                    <span className="font-medium">
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgCalories /
                                                                user.targetDailyCalories) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                                                    <div
                                                        className="bg-orange-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (analytics
                                                                    .summary
                                                                    .avgCalories /
                                                                    user.targetDailyCalories) *
                                                                    100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {user?.targetDailyProteins && (
                                            <div>
                                                <div className="flex justify-between items-center text-xs md:text-sm mb-1">
                                                    <span className="text-gray-600">
                                                        Protein
                                                    </span>
                                                    <span className="font-medium">
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgProtein /
                                                                user.targetDailyProteins) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                                                    <div
                                                        className="bg-red-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (analytics
                                                                    .summary
                                                                    .avgProtein /
                                                                    user.targetDailyProteins) *
                                                                    100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {user?.targetDailyWater && (
                                            <div>
                                                <div className="flex justify-between items-center text-xs md:text-sm mb-1">
                                                    <span className="text-gray-600">
                                                        Water
                                                    </span>
                                                    <span className="font-medium">
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgWater /
                                                                user.targetDailyWater) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                                                    <div
                                                        className="bg-blue-500 h-1.5 md:h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (analytics
                                                                    .summary
                                                                    .avgWater /
                                                                    user.targetDailyWater) *
                                                                    100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 md:py-12">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-md mx-auto">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                                No Analytics Data
                            </h3>
                            <p className="text-sm md:text-base text-gray-600 mb-4">
                                Start tracking your nutrition to see detailed
                                analytics and insights.
                            </p>
                            <div className="text-xs md:text-sm text-gray-500">
                                Add some food entries to unlock:
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Charts
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                    <Target className="w-3 h-3 mr-1" />
                                    Goals
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Streaks
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Analytics;
