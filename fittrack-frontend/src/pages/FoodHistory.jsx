import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { foodAPI } from "../services/api";
import WaterTracker from "../components/WaterTracker";
import {
    Calendar,
    Clock,
    Search,
    Filter,
    Trash2,
    Flame,
    Beef,
    Droplets,
    UtensilsCrossed,
    TrendingUp,
    AlertTriangle,
    X,
    CheckCircle,
    ArrowLeft,
    BarChart3,
} from "lucide-react";

const FoodHistory = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [dateRange, setDateRange] = useState("7");
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [foodToDelete, setFoodToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    function formatDate(dateString) {
        const date = new Date(dateString);

        // Uses UTC getters to avoid timezone shift
        const options = {
            weekday: "short",
            day: "2-digit",
            month: "short",
        };

        return date.toLocaleDateString("en-GB", {
            ...options,
            timeZone: "UTC",
        });
    }

    const getProgressPercentage = (consumed, target) => {
        if (!target) return 0;
        return Math.min((consumed / target) * 100, 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "from-emerald-500 to-green-500";
        if (percentage >= 75) return "from-amber-400 to-orange-500";
        if (percentage >= 50) return "from-orange-400 to-red-400";
        return "from-red-400 to-pink-500";
    };

    const filteredFoods =
        selectedEntry?.foods?.filter((food) =>
            food.foodName.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

    const handleDeleteClick = (food) => {
        setFoodToDelete(food);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!foodToDelete) return;

        setDeleteLoading(true);
        try {
            const response = await foodAPI.removeFood(foodToDelete._id);
            if (response.data.success) {
                setSelectedEntry(response.data.data);
                setEntries((prev) =>
                    prev.map((entry) =>
                        entry._id === response.data.data._id
                            ? response.data.data
                            : entry
                    )
                );
                setShowDeleteModal(false);
                setFoodToDelete(null);
            }
        } catch (error) {
            console.error("Error removing food:", error);
            alert("Failed to remove food. Please try again.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setFoodToDelete(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => {
                                    if (window.history.length > 1) {
                                        window.history.back();
                                    } else {
                                        window.location.href = "/";
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-xl font-bold text-gray-900">
                                        Food History
                                    </h1>
                                    <p className="text-xs md:text-sm text-gray-500">
                                        Track your nutrition journey
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Mobile-first responsive grid */}
                <div className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
                    {/* Left Panel - History Overview */}
                    <div className="lg:col-span-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                    <span>Recent Days</span>
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <select
                                        value={dateRange}
                                        onChange={(e) =>
                                            setDateRange(e.target.value)
                                        }
                                        className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="3">3 days</option>
                                        <option value="7">7 days</option>
                                        <option value="14">14 days</option>
                                        <option value="30">30 days</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-16 bg-gray-200 rounded-xl"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2 md:space-y-3">
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
                                                className={`w-full text-left p-3 md:p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                                    selectedDate ===
                                                    entry.date.split("T")[0]
                                                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-2 md:mb-3">
                                                    <span className="font-semibold text-gray-900 text-sm md:text-base">
                                                        {formatDate(entry.date)}
                                                    </span>
                                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                        <UtensilsCrossed className="w-3 h-3" />
                                                        <span>
                                                            {entry.foods.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1 md:gap-2">
                                                    <div className="text-center">
                                                        <div
                                                            className={`text-xs font-medium px-1 py-1 rounded-lg bg-gradient-to-r ${getProgressColor(
                                                                calorieProgress
                                                            )} text-white`}
                                                        >
                                                            {calorieProgress.toFixed(
                                                                0
                                                            )}
                                                            %
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Cal
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div
                                                            className={`text-xs font-medium px-1 py-1 rounded-lg bg-gradient-to-r ${getProgressColor(
                                                                proteinProgress
                                                            )} text-white`}
                                                        >
                                                            {proteinProgress.toFixed(
                                                                0
                                                            )}
                                                            %
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Pro
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div
                                                            className={`text-xs font-medium px-1 py-1 rounded-lg bg-gradient-to-r ${getProgressColor(
                                                                waterProgress
                                                            )} text-white`}
                                                        >
                                                            {waterProgress.toFixed(
                                                                0
                                                            )}
                                                            %
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            H₂O
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {entries.length === 0 && (
                                        <div className="text-center text-gray-500 py-8">
                                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p>No entries found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Selected Day Details */}
                    <div className="lg:col-span-8">
                        {/* Date Selector & Summary */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 space-y-3 sm:space-y-0">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {formatDate(selectedDate + "T00:00:00")}
                                </h3>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    max={new Date().toISOString().split("T")[0]}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            {selectedEntry && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    <div className="text-center p-3 md:p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                                        <Flame className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2" />
                                        <div className="text-lg md:text-2xl font-bold">
                                            {selectedEntry.totalCalories}
                                        </div>
                                        <div className="text-xs md:text-sm opacity-90">
                                            Calories
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">
                                            {getProgressPercentage(
                                                selectedEntry.totalCalories,
                                                user?.targetDailyCalories
                                            ).toFixed(1)}
                                            % of goal
                                        </div>
                                    </div>
                                    <div className="text-center p-3 md:p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl text-white">
                                        <Beef className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2" />
                                        <div className="text-lg md:text-2xl font-bold">
                                            {selectedEntry.totalProtein}g
                                        </div>
                                        <div className="text-xs md:text-sm opacity-90">
                                            Protein
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">
                                            {getProgressPercentage(
                                                selectedEntry.totalProtein,
                                                user?.targetDailyProteins
                                            ).toFixed(1)}
                                            % of goal
                                        </div>
                                    </div>
                                    <div className="text-center p-3 md:p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
                                        <Droplets className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2" />
                                        <div className="text-lg md:text-2xl font-bold">
                                            {selectedEntry.water}ml
                                        </div>
                                        <div className="text-xs md:text-sm opacity-90">
                                            Water
                                        </div>
                                        <div className="text-xs opacity-75 mt-1">
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

                        {/* Water Tracker - Only show for today or if user wants to update past entries */}
                        {selectedEntry &&
                            selectedDate ===
                                new Date().toISOString().split("T")[0] && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                        <Droplets className="w-5 h-5 text-blue-600" />
                                        <span>Water Tracker</span>
                                    </h3>
                                    <WaterTracker
                                        todayEntry={selectedEntry}
                                        onUpdate={handleWaterUpdate}
                                        targetWater={
                                            user?.targetDailyWater || 2500
                                        }
                                        showProgress={true}
                                        size="normal"
                                    />
                                </div>
                            )}

                        {/* Food Items */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 space-y-3 sm:space-y-0">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                    <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
                                    <span>Food Items</span>
                                </h3>

                                {selectedEntry?.foods?.length > 0 && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search foods..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full sm:w-auto"
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedEntry ? (
                                filteredFoods.length > 0 ? (
                                    <div className="space-y-3 md:space-y-4">
                                        {filteredFoods.map((food) => (
                                            <div
                                                key={food._id}
                                                className="border border-gray-200 rounded-xl p-3 md:p-4 hover:shadow-md transition-shadow duration-200"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                                                {food.foodName}
                                                            </h4>
                                                            {food.isCustomFood && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Custom
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center space-x-2 mb-2 text-xs md:text-sm text-gray-600">
                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                            <span>
                                                                {food.timestamp
                                                                    ? new Date(
                                                                          food.timestamp
                                                                      ).toLocaleTimeString(
                                                                          [],
                                                                          {
                                                                              hour: "2-digit",
                                                                              minute: "2-digit",
                                                                          }
                                                                      )
                                                                    : "No time recorded"}
                                                            </span>
                                                            <span className="text-gray-400">
                                                                •
                                                            </span>
                                                            <span>
                                                                {
                                                                    food.servingSize
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs md:text-sm">
                                                            <div className="flex items-center space-x-1">
                                                                <Flame className="w-3 h-3 text-orange-500" />
                                                                <span>
                                                                    {
                                                                        food.calories
                                                                    }{" "}
                                                                    cal
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <Beef className="w-3 h-3 text-red-500" />
                                                                <span>
                                                                    {
                                                                        food.protein
                                                                    }
                                                                    g
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-600">
                                                                <span>
                                                                    Carbs:{" "}
                                                                    {food.carbs}
                                                                    g
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-600">
                                                                <span>
                                                                    Fat:{" "}
                                                                    {food.fat}g
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedDate ===
                                                        new Date()
                                                            .toISOString()
                                                            .split("T")[0] && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    food
                                                                )
                                                            }
                                                            className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                            title="Delete food item"
                                                        >
                                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8 md:py-12">
                                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p className="text-sm md:text-base">
                                            {searchTerm
                                                ? "No foods match your search"
                                                : "No food items recorded for this date"}
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-gray-500 py-8 md:py-12">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-sm md:text-base">
                                        Select a date to view food entries
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Confirm Deletion
                                </h3>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                    {foodToDelete?.foodName}
                                </span>
                                ? This action cannot be undone.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    {deleteLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodHistory;
