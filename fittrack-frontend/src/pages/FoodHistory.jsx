import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import { foodAPI } from "../services/api";
import WaterTracker from "../components/WaterTracker";

const FoodHistory = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [dateRange, setDateRange] = useState("7"); // days
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const response = await foodAPI.getHistory({
                    limit: parseInt(dateRange),
                });
                if (response.data.success) {
                    setEntries(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [dateRange]);

    useEffect(() => {
        if (selectedDate) {
            fetchEntryByDate(selectedDate);
        }
    }, [selectedDate]);

    const fetchEntryByDate = async (date) => {
        try {
            const response = await foodAPI.getByDate(date);
            if (response.data.success) {
                setSelectedEntry(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching entry by date:", error);
            setSelectedEntry(null);
        }
    };

    const handleWaterUpdate = (updatedEntry) => {
        setSelectedEntry(updatedEntry);
        // Update in entries list if it exists
        setEntries((prev) =>
            prev.map((entry) =>
                entry._id === updatedEntry._id ? updatedEntry : entry
            )
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        }
    };

    const getProgressPercentage = (consumed, target) => {
        if (!target) return 0;
        return Math.min((consumed / target) * 100, 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "text-green-600 bg-green-100";
        if (percentage >= 75) return "text-yellow-600 bg-yellow-100";
        if (percentage >= 50) return "text-orange-600 bg-orange-100";
        return "text-red-600 bg-red-100";
    };

    const filteredFoods =
        selectedEntry?.foods?.filter((food) =>
            food.foodName.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

    const removeFood = async (foodEntryId) => {
        try {
            const response = await foodAPI.removeFood(foodEntryId);
            if (response.data.success) {
                setSelectedEntry(response.data.data);
                // Update in entries list if it exists
                setEntries((prev) =>
                    prev.map((entry) =>
                        entry._id === response.data.data._id
                            ? response.data.data
                            : entry
                    )
                );
            }
        } catch (error) {
            console.error("Error removing food:", error);
            alert("Failed to remove food. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Nutrition History
                    </h1>
                    <p className="text-gray-600">
                        Track and review your daily nutrition progress
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - History Overview */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Recent Days
                            </h3>

                            {/* Date Range Filter */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Show last
                                </label>
                                <select
                                    value={dateRange}
                                    onChange={(e) =>
                                        setDateRange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="7">7 days</option>
                                    <option value="14">14 days</option>
                                    <option value="30">30 days</option>
                                </select>
                            </div>

                            {/* History List */}
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-16 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {entries.map((entry) => {
                                        const calorieProgress =
                                            getProgressPercentage(
                                                entry.totalCalories,
                                                user?.targetDailyCalories
                                            );
                                        const proteinProgress =
                                            getProgressPercentage(
                                                entry.totalProtein,
                                                user?.targetDailyProteins
                                            );
                                        const waterProgress =
                                            getProgressPercentage(
                                                entry.water,
                                                user?.targetDailyWater
                                            );

                                        return (
                                            <button
                                                key={entry._id}
                                                onClick={() =>
                                                    setSelectedDate(
                                                        entry.date.split("T")[0]
                                                    )
                                                }
                                                className={`w-full text-left p-3 rounded-lg border transition duration-200 ${
                                                    selectedDate ===
                                                    entry.date.split("T")[0]
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-900">
                                                        {formatDate(entry.date)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {entry.foods.length}{" "}
                                                        items
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1 text-xs">
                                                    <div
                                                        className={`px-2 py-1 rounded ${getProgressColor(
                                                            calorieProgress
                                                        )}`}
                                                    >
                                                        {calorieProgress.toFixed(
                                                            0
                                                        )}
                                                        % cal
                                                    </div>
                                                    <div
                                                        className={`px-2 py-1 rounded ${getProgressColor(
                                                            proteinProgress
                                                        )}`}
                                                    >
                                                        {proteinProgress.toFixed(
                                                            0
                                                        )}
                                                        % pro
                                                    </div>
                                                    <div
                                                        className={`px-2 py-1 rounded ${getProgressColor(
                                                            waterProgress
                                                        )}`}
                                                    >
                                                        {waterProgress.toFixed(
                                                            0
                                                        )}
                                                        % H₂O
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {entries.length === 0 && (
                                        <div className="text-center text-gray-500 py-8">
                                            No entries found for the selected
                                            period
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Selected Day Details */}
                    <div className="lg:col-span-2">
                        {/* Date Selector */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Selected Date
                                </h3>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    max={new Date().toISOString().split("T")[0]}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {selectedEntry && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {selectedEntry.totalCalories}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Calories
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {getProgressPercentage(
                                                selectedEntry.totalCalories,
                                                user?.targetDailyCalories
                                            ).toFixed(1)}
                                            % of goal
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">
                                            {selectedEntry.totalProtein}g
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Protein
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {getProgressPercentage(
                                                selectedEntry.totalProtein,
                                                user?.targetDailyProteins
                                            ).toFixed(1)}
                                            % of goal
                                        </div>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {selectedEntry.water}ml
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Water
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {getProgressPercentage(
                                                selectedEntry.water,
                                                user?.targetDailyWater
                                            ).toFixed(1)}
                                            % of goal
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Water Tracker for Selected Date */}
                        {selectedEntry &&
                            selectedDate ===
                                new Date().toISOString().split("T")[0] && (
                                <div className="mb-6">
                                    <WaterTracker
                                        todayEntry={selectedEntry}
                                        onUpdate={handleWaterUpdate}
                                        targetWater={
                                            user?.targetDailyWater || 2000
                                        }
                                        size="normal"
                                    />
                                </div>
                            )}

                        {/* Food Items */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Food Items (
                                    {selectedEntry?.foods?.length || 0})
                                </h3>
                                {selectedEntry?.foods?.length > 0 && (
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        placeholder="Search foods..."
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                )}
                            </div>

                            {selectedEntry ? (
                                filteredFoods.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredFoods.map((food) => (
                                            <div
                                                key={food._id}
                                                className="border rounded-lg p-4 hover:bg-gray-50 transition duration-200"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900 mb-1">
                                                            {food.foodName}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {food.servingSize ||
                                                                `${food.quantity}${food.unit}`}
                                                        </p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">
                                                                    Calories:
                                                                </span>
                                                                <span className="ml-1 font-medium">
                                                                    {
                                                                        food.calories
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">
                                                                    Protein:
                                                                </span>
                                                                <span className="ml-1 font-medium">
                                                                    {
                                                                        food.protein
                                                                    }
                                                                    g
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">
                                                                    Carbs:
                                                                </span>
                                                                <span className="ml-1 font-medium">
                                                                    {food.carbs}
                                                                    g
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">
                                                                    Fat:
                                                                </span>
                                                                <span className="ml-1 font-medium">
                                                                    {food.fat}g
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            Added at{" "}
                                                            {new Date(
                                                                food.timestamp
                                                            ).toLocaleTimeString()}
                                                        </div>
                                                    </div>

                                                    {selectedDate ===
                                                        new Date()
                                                            .toISOString()
                                                            .split("T")[0] && (
                                                        <button
                                                            onClick={() =>
                                                                removeFood(
                                                                    food._id
                                                                )
                                                            }
                                                            className="ml-4 text-red-500 hover:text-red-700 transition duration-200"
                                                            title="Remove food item"
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        {searchTerm
                                            ? "No foods match your search"
                                            : "No food items recorded for this date"}
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Select a date to view food entries
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FoodHistory;
