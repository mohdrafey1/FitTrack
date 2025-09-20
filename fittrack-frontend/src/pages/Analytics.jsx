import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import { foodAPI } from "../services/api";

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getGoalAchievementColor = (percentage) => {
        if (percentage >= 100) return "text-green-600 bg-green-100";
        if (percentage >= 75) return "text-yellow-600 bg-yellow-100";
        if (percentage >= 50) return "text-orange-600 bg-orange-100";
        return "text-red-600 bg-red-100";
    };

    const StatCard = ({ title, value, unit, target, icon, color }) => {
        const percentage = target ? Math.round((value / target) * 100) : 0;

        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                    <span className="text-2xl">{icon}</span>
                </div>
                <div className="text-center">
                    <div
                        className={`text-3xl font-bold text-${color}-600 mb-1`}
                    >
                        {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                        <span className="text-lg text-gray-500 ml-1">
                            {unit}
                        </span>
                    </div>
                    {target && (
                        <div className="text-sm text-gray-600">
                            Target: {target.toLocaleString()}
                            {unit}
                        </div>
                    )}
                    {percentage > 0 && (
                        <div
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getGoalAchievementColor(
                                percentage
                            )}`}
                        >
                            {percentage}% of goal
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const TrendChart = ({ data, title, dataKey, color, unit }) => {
        const maxValue = Math.max(...data.map((item) => item[dataKey]));
        const minValue = Math.min(...data.map((item) => item[dataKey]));
        const range = maxValue - minValue || 1;

        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {title}
                </h3>
                <div className="relative h-64">
                    <div className="absolute inset-0 flex items-end justify-between">
                        {data.map((item, index) => {
                            const height =
                                ((item[dataKey] - minValue) / range) * 100;
                            return (
                                <div
                                    key={index}
                                    className="flex flex-col items-center flex-1 px-1"
                                >
                                    <div
                                        className={`bg-${color}-500 rounded-t transition-all duration-500 ease-out mb-2 relative group cursor-pointer`}
                                        style={{
                                            height: `${Math.max(height, 5)}%`,
                                            width: "80%",
                                        }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {item[dataKey]}
                                            {unit}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left">
                                        {formatDate(item.date)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                        <span>{Math.round(maxValue)}</span>
                        <span>{Math.round((maxValue + minValue) / 2)}</span>
                        <span>{Math.round(minValue)}</span>
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
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🔥 Tracking Streaks
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                            {currentStreak}
                        </div>
                        <div className="text-sm text-gray-600">
                            Current Streak
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                            {longestStreak}
                        </div>
                        <div className="text-sm text-gray-600">
                            Longest Streak
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Nutrition Analytics
                    </h1>
                    <p className="text-gray-600">
                        Insights and trends from your nutrition tracking
                    </p>
                </div>

                {/* Period Selector */}
                <div className="mb-6">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">
                            Analytics Period:
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="14">Last 14 days</option>
                            <option value="30">Last 30 days</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
                ) : analytics ? (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Avg Daily Calories"
                                value={analytics.summary.avgCalories}
                                unit=""
                                target={user?.targetDailyCalories}
                                icon="🔥"
                                color="orange"
                            />
                            <StatCard
                                title="Avg Daily Protein"
                                value={analytics.summary.avgProtein}
                                unit="g"
                                target={user?.targetDailyProteins}
                                icon="🥩"
                                color="red"
                            />
                            <StatCard
                                title="Avg Daily Water"
                                value={analytics.summary.avgWater}
                                unit="ml"
                                target={user?.targetDailyWater}
                                icon="💧"
                                color="blue"
                            />
                            <StatCard
                                title="Active Days"
                                value={analytics.summary.totalEntries}
                                unit={`/${analytics.period.days} days`}
                                icon="📅"
                                color="green"
                            />
                        </div>

                        {/* Best Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {analytics.bestDays.calories && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        🏆 Best Calorie Day
                                    </h3>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600 mb-1">
                                            {analytics.bestDays.calories.value}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(
                                                analytics.bestDays.calories.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analytics.bestDays.protein && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        💪 Best Protein Day
                                    </h3>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600 mb-1">
                                            {analytics.bestDays.protein.value}g
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(
                                                analytics.bestDays.protein.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {analytics.bestDays.water && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        🌊 Best Hydration Day
                                    </h3>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 mb-1">
                                            {analytics.bestDays.water.value}ml
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(
                                                analytics.bestDays.water.date
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Streak Information */}
                        <div className="mb-8">
                            <StreakDisplay entries={analytics.entries} />
                        </div>

                        {/* Trend Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <TrendChart
                                data={analytics.entries.slice(-14)} // Last 14 entries for better visualization
                                title="Calorie Trend"
                                dataKey="calories"
                                color="orange"
                                unit=""
                            />
                            <TrendChart
                                data={analytics.entries.slice(-14)}
                                title="Protein Trend"
                                dataKey="protein"
                                color="red"
                                unit="g"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <TrendChart
                                data={analytics.entries.slice(-14)}
                                title="Water Intake Trend"
                                dataKey="water"
                                color="blue"
                                unit="ml"
                            />
                            <TrendChart
                                data={analytics.entries.slice(-14)}
                                title="Food Items Logged"
                                dataKey="foodCount"
                                color="green"
                                unit=" items"
                            />
                        </div>

                        {/* Insights */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                📊 Key Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Nutrition Summary
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex justify-between">
                                            <span>Total Calories Tracked:</span>
                                            <span className="font-medium">
                                                {analytics.summary.totalCalories.toLocaleString()}
                                            </span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Total Protein Intake:</span>
                                            <span className="font-medium">
                                                {analytics.summary.totalProtein.toLocaleString()}
                                                g
                                            </span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Total Water Consumed:</span>
                                            <span className="font-medium">
                                                {analytics.summary.totalWater.toLocaleString()}
                                                ml
                                            </span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Days with Data:</span>
                                            <span className="font-medium">
                                                {analytics.summary.totalEntries}
                                                /{analytics.period.days}
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Goal Achievement
                                    </h4>
                                    <div className="space-y-3">
                                        {user?.targetDailyCalories && (
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>
                                                        Calorie Goals Met
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgCalories /
                                                                user.targetDailyCalories) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-orange-500 h-2 rounded-full"
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
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>
                                                        Protein Goals Met
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgProtein /
                                                                user.targetDailyProteins) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
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
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>
                                                        Hydration Goals Met
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (analytics.summary
                                                                .avgWater /
                                                                user.targetDailyWater) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
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
                    <div className="text-center py-12">
                        <div className="text-gray-500 text-lg">
                            No data available for the selected period
                        </div>
                        <p className="text-gray-400 mt-2">
                            Start tracking your nutrition to see analytics here
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Analytics;
