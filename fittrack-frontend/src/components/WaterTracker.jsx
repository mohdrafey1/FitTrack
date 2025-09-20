import { useState } from "react";
import { foodAPI } from "../services/api";

const WaterTracker = ({
    todayEntry,
    onUpdate,
    targetWater = 2000,
    showProgress = true,
    size = "normal", // "small", "normal", "large"
}) => {
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    const waterConsumed = todayEntry?.water || 0;
    const percentage = Math.min((waterConsumed / targetWater) * 100, 100);

    const getProgressColor = () => {
        if (percentage >= 100) return "from-green-400 to-green-500";
        if (percentage >= 75) return "from-blue-400 to-blue-500";
        if (percentage >= 50) return "from-cyan-400 to-cyan-500";
        return "from-gray-400 to-gray-500";
    };

    const quickAmounts = [250, 500, 750, 1000];

    const handleWaterUpdate = async (amount) => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await foodAPI.updateWater(amount);
            if (response.data.success && onUpdate) {
                onUpdate(response.data.data);
            }
        } catch (error) {
            console.error("Error updating water:", error);
            alert("Failed to update water intake. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCustomWater = async () => {
        const amount = parseFloat(customAmount);
        if (!amount || amount <= 0) return;

        await handleWaterUpdate(amount);
        setCustomAmount("");
        setShowCustomInput(false);
    };

    const handleDecrease = async () => {
        if (waterConsumed >= 250) {
            await handleWaterUpdate(-250);
        }
    };

    const formatWater = (amount) => {
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}L`;
        }
        return `${amount}ml`;
    };

    const sizeClasses = {
        small: {
            container: "p-4",
            title: "text-base",
            progress: "h-2",
            button: "px-3 py-1 text-sm",
            grid: "grid-cols-2 gap-2",
            text: "text-sm",
        },
        normal: {
            container: "p-6",
            title: "text-lg",
            progress: "h-3",
            button: "px-4 py-2 text-sm",
            grid: "grid-cols-2 gap-2",
            text: "text-base",
        },
        large: {
            container: "p-8",
            title: "text-xl",
            progress: "h-4",
            button: "px-6 py-3 text-base",
            grid: "grid-cols-4 gap-3",
            text: "text-lg",
        },
    };

    const classes = sizeClasses[size];

    return (
        <div className={`bg-white rounded-lg shadow ${classes.container}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold text-gray-900 ${classes.title}`}>
                    💧 Water Tracker
                </h3>
                <div className="text-right">
                    <div className={`font-bold text-blue-600 ${classes.text}`}>
                        {formatWater(waterConsumed)}
                    </div>
                    <div className="text-xs text-gray-500">
                        / {formatWater(targetWater)}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="relative">
                            <div
                                className={`bg-gradient-to-r ${getProgressColor()} ${
                                    classes.progress
                                } transition-all duration-500 ease-out`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                            {/* Wave effect */}
                            <div
                                className={`absolute top-0 bg-gradient-to-r from-transparent via-white to-transparent ${classes.progress} opacity-30 animate-pulse`}
                                style={{
                                    width: `${Math.min(percentage + 20, 100)}%`,
                                    left: `${Math.max(percentage - 20, 0)}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                    {percentage >= 100 && (
                        <div className="text-center mt-2">
                            <span className="text-sm text-green-600 font-medium">
                                🎉 Daily goal achieved!
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Add Buttons */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Add
                </label>
                <div className={`grid ${classes.grid}`}>
                    {quickAmounts.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => handleWaterUpdate(amount)}
                            disabled={loading}
                            className={`${classes.button} bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50`}
                        >
                            +{amount}ml
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
                {!showCustomInput ? (
                    <button
                        onClick={() => setShowCustomInput(true)}
                        className="w-full text-left text-sm text-blue-600 hover:text-blue-700 transition duration-200"
                    >
                        + Add custom amount
                    </button>
                ) : (
                    <div className="space-y-2">
                        <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Enter amount in ml"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={handleCustomWater}
                                disabled={
                                    !customAmount ||
                                    parseFloat(customAmount) <= 0 ||
                                    loading
                                }
                                className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-md hover:bg-blue-600 transition duration-200 disabled:opacity-50 text-sm"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomInput(false);
                                    setCustomAmount("");
                                }}
                                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-md hover:bg-gray-600 transition duration-200 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-2">
                <button
                    onClick={handleDecrease}
                    disabled={waterConsumed < 250 || loading}
                    className={`${classes.button} flex-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    -250ml
                </button>
                <button
                    onClick={() => handleWaterUpdate(250)}
                    disabled={loading}
                    className={`${classes.button} flex-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50`}
                >
                    +250ml
                </button>
            </div>

            {/* Daily Stats */}
            {size !== "small" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>
                            Remaining:{" "}
                            {Math.max(0, targetWater - waterConsumed)}ml
                        </span>
                        <span>{Math.floor(waterConsumed / 250)} glasses</span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
};

export default WaterTracker;
