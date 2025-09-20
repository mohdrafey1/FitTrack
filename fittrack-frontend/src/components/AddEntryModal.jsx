import { useState, useEffect } from "react";
import { foodAPI, customFoodAPI } from "../services/api";
import AddCustomFoodModal from "./AddCustomFoodModal";

// Import food database
const foodDatabase = [
    // Proteins
    {
        id: 1,
        name: "Chicken Breast",
        category: "protein",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 2,
        name: "Eggs",
        category: "protein",
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        servingSizes: { small: 50, medium: 100, large: 150 },
    },
    {
        id: 3,
        name: "Paneer",
        category: "protein",
        calories: 265,
        protein: 18,
        carbs: 3.4,
        fat: 20,
        servingSizes: { small: 50, medium: 100, large: 150 },
    },
    {
        id: 4,
        name: "Dal (Lentils)",
        category: "protein",
        calories: 116,
        protein: 9,
        carbs: 20,
        fat: 0.4,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 5,
        name: "Fish",
        category: "protein",
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },

    // Carbohydrates
    {
        id: 6,
        name: "Rice",
        category: "carbs",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 7,
        name: "Roti/Chapati",
        category: "carbs",
        calories: 297,
        protein: 12,
        carbs: 51,
        fat: 7,
        servingSizes: { small: 50, medium: 75, large: 100 },
    },
    {
        id: 8,
        name: "Bread",
        category: "carbs",
        calories: 265,
        protein: 9,
        carbs: 49,
        fat: 3.2,
        servingSizes: { small: 50, medium: 75, large: 100 },
    },
    {
        id: 9,
        name: "Oats",
        category: "carbs",
        calories: 389,
        protein: 16.9,
        carbs: 66,
        fat: 6.9,
        servingSizes: { small: 50, medium: 75, large: 100 },
    },

    // Fruits
    {
        id: 10,
        name: "Banana",
        category: "fruit",
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 11,
        name: "Apple",
        category: "fruit",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 12,
        name: "Orange",
        category: "fruit",
        calories: 47,
        protein: 0.9,
        carbs: 12,
        fat: 0.1,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },

    // Vegetables
    {
        id: 13,
        name: "Broccoli",
        category: "vegetable",
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },
    {
        id: 14,
        name: "Spinach",
        category: "vegetable",
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },

    // Dairy
    {
        id: 15,
        name: "Milk",
        category: "dairy",
        calories: 42,
        protein: 3.4,
        carbs: 5,
        fat: 1,
        servingSizes: { small: 200, medium: 250, large: 300 },
    },
    {
        id: 16,
        name: "Curd/Yogurt",
        category: "dairy",
        calories: 61,
        protein: 3.5,
        carbs: 4.7,
        fat: 3.3,
        servingSizes: { small: 100, medium: 150, large: 200 },
    },

    // Nuts & Seeds
    {
        id: 17,
        name: "Almonds",
        category: "nuts",
        calories: 579,
        protein: 21,
        carbs: 22,
        fat: 50,
        servingSizes: { small: 20, medium: 30, large: 40 },
    },
    {
        id: 18,
        name: "Peanuts",
        category: "nuts",
        calories: 567,
        protein: 26,
        carbs: 16,
        fat: 49,
        servingSizes: { small: 20, medium: 30, large: 40 },
    },

    // Snacks
    {
        id: 19,
        name: "Biscuits",
        category: "snack",
        calories: 502,
        protein: 6,
        carbs: 62,
        fat: 25,
        servingSizes: { small: 20, medium: 30, large: 50 },
    },
    {
        id: 20,
        name: "Chocolate",
        category: "snack",
        calories: 546,
        protein: 4.9,
        carbs: 61,
        fat: 31,
        servingSizes: { small: 20, medium: 30, large: 50 },
    },
];

const AddEntryModal = ({ isOpen, onClose, onAdd, type = "food" }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [servingSize, setServingSize] = useState("medium");
    const [customQuantity, setCustomQuantity] = useState(false);
    const [waterAmount, setWaterAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [filteredFoods, setFilteredFoods] = useState(foodDatabase);
    const [customFoods, setCustomFoods] = useState([]);
    const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
    const [allFoods, setAllFoods] = useState(foodDatabase);

    useEffect(() => {
        if (isOpen && type === "food") {
            loadCustomFoods();
        }
    }, [isOpen, type]);

    const loadCustomFoods = async () => {
        try {
            const response = await customFoodAPI.getCustomFoods();
            if (response.data.success) {
                const customFoodsList = response.data.data.map((food) => ({
                    ...food,
                    id: `custom_${food._id}`,
                    isCustom: true,
                }));
                setCustomFoods(customFoodsList);
                const combined = [...foodDatabase, ...customFoodsList];
                setAllFoods(combined);
                setFilteredFoods(combined);
            }
        } catch (error) {
            console.error("Error loading custom foods:", error);
        }
    };

    useEffect(() => {
        if (type === "food") {
            const filtered = allFoods.filter(
                (food) =>
                    food.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    food.category
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
            setFilteredFoods(filtered);
        }
    }, [searchTerm, type, allFoods]);

    const calculateNutrition = () => {
        if (!selectedFood) return null;

        const actualQuantity = customQuantity
            ? parseFloat(quantity) || 0
            : selectedFood.servingSizes[servingSize] || 0;

        if (actualQuantity <= 0) return null;

        const multiplier = actualQuantity / 100;

        return {
            calories: Math.round(selectedFood.calories * multiplier),
            protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
            carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
            fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
            actualQuantity,
        };
    };

    const handleAddFood = async () => {
        if (!selectedFood) return;

        const nutrition = calculateNutrition();
        if (!nutrition) return;

        setLoading(true);
        try {
            const foodData = {
                foodId: selectedFood.isCustom
                    ? selectedFood._id
                    : selectedFood.id,
                foodName: selectedFood.name,
                quantity: nutrition.actualQuantity,
                unit: "g",
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fat: nutrition.fat,
                servingSize: customQuantity
                    ? `${nutrition.actualQuantity}g`
                    : `${servingSize} (${nutrition.actualQuantity}g)`,
                isCustomFood: selectedFood.isCustom || false,
            };

            const response = await foodAPI.addFood(foodData);
            if (response.data.success) {
                // Increment usage for custom foods
                if (selectedFood.isCustom) {
                    try {
                        await customFoodAPI.incrementUsage(selectedFood._id);
                    } catch (error) {
                        console.warn(
                            "Failed to increment custom food usage:",
                            error
                        );
                    }
                }

                onAdd(response.data.data);
                handleClose();
            }
        } catch (error) {
            console.error("Error adding food:", error);
            alert("Failed to add food. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCustomFoodAdded = (newCustomFood) => {
        const formattedFood = {
            ...newCustomFood,
            id: `custom_${newCustomFood._id}`,
            isCustom: true,
        };

        const updatedCustomFoods = [...customFoods, formattedFood];
        setCustomFoods(updatedCustomFoods);

        const updatedAllFoods = [...foodDatabase, ...updatedCustomFoods];
        setAllFoods(updatedAllFoods);

        // Update filtered foods if search matches
        const filtered = updatedAllFoods.filter(
            (food) =>
                food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                food.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFoods(filtered);

        setShowCustomFoodModal(false);
    };

    const handleAddWater = async () => {
        const amount = parseFloat(waterAmount);
        if (!amount || amount <= 0) return;

        setLoading(true);
        try {
            const response = await foodAPI.updateWater(amount);
            if (response.data.success) {
                onAdd(response.data.data);
                handleClose();
            }
        } catch (error) {
            console.error("Error adding water:", error);
            alert("Failed to add water. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedFood(null);
        setQuantity("");
        setServingSize("medium");
        setCustomQuantity(false);
        setWaterAmount("");
        setShowCustomFoodModal(false);
        onClose();
    };

    const quickWaterAmounts = [250, 500, 750, 1000];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {type === "food" ? "Add Food" : "Add Water"}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
                    </div>

                    {type === "food" ? (
                        <>
                            {/* Food Search */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Search Food
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCustomFoodModal(true)
                                        }
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        + Add Custom Food
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search for food items..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Food List */}
                            {!selectedFood && (
                                <div className="mb-4 max-h-60 overflow-y-auto">
                                    {filteredFoods.length > 0 ? (
                                        <div className="space-y-2">
                                            {filteredFoods.map((food) => (
                                                <button
                                                    key={food.id}
                                                    onClick={() =>
                                                        setSelectedFood(food)
                                                    }
                                                    className="w-full text-left p-3 border rounded-md hover:bg-gray-50 transition duration-200"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="font-medium text-gray-900">
                                                                    {food.name}
                                                                </h3>
                                                                {food.isCustom && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        Custom
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 capitalize">
                                                                {food.category}
                                                                {food.brand &&
                                                                    ` • ${food.brand}`}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {food.calories}{" "}
                                                                cal
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                per 100g
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 mb-4">
                                                <svg
                                                    className="mx-auto h-12 w-12"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 mb-4">
                                                No foods found for "{searchTerm}
                                                "
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowCustomFoodModal(true)
                                                }
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                            >
                                                + Create Custom Food
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Food Details */}
                            {selectedFood && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-medium text-gray-900">
                                            {selectedFood.name}
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setSelectedFood(null)
                                            }
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Quantity Selection */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Serving Size
                                        </label>
                                        <div className="space-y-2">
                                            {!customQuantity && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {Object.entries(
                                                        selectedFood.servingSizes
                                                    ).map(([size, amount]) => (
                                                        <button
                                                            key={size}
                                                            onClick={() =>
                                                                setServingSize(
                                                                    size
                                                                )
                                                            }
                                                            className={`p-2 text-xs rounded border ${
                                                                servingSize ===
                                                                size
                                                                    ? "bg-orange-500 text-white border-orange-500"
                                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <div className="font-medium capitalize">
                                                                {size}
                                                            </div>
                                                            <div>{amount}g</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="customQuantity"
                                                    checked={customQuantity}
                                                    onChange={(e) =>
                                                        setCustomQuantity(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="rounded"
                                                />
                                                <label
                                                    htmlFor="customQuantity"
                                                    className="text-sm text-gray-700"
                                                >
                                                    Custom amount
                                                </label>
                                            </div>

                                            {customQuantity && (
                                                <input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) =>
                                                        setQuantity(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter amount in grams"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Nutrition Preview */}
                                    {(() => {
                                        const nutrition = calculateNutrition();
                                        return nutrition ? (
                                            <div className="bg-white p-3 rounded border">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                    Nutrition (
                                                    {nutrition.actualQuantity}g)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        Calories:{" "}
                                                        <span className="font-medium">
                                                            {nutrition.calories}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Protein:{" "}
                                                        <span className="font-medium">
                                                            {nutrition.protein}g
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Carbs:{" "}
                                                        <span className="font-medium">
                                                            {nutrition.carbs}g
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Fat:{" "}
                                                        <span className="font-medium">
                                                            {nutrition.fat}g
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}

                            {/* Add Food Button */}
                            <button
                                onClick={handleAddFood}
                                disabled={
                                    !selectedFood ||
                                    !calculateNutrition() ||
                                    loading
                                }
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Adding..." : "Add Food"}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Water Entry */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Water Amount (ml)
                                </label>
                                <input
                                    type="number"
                                    value={waterAmount}
                                    onChange={(e) =>
                                        setWaterAmount(e.target.value)
                                    }
                                    placeholder="Enter amount in ml"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Quick Water Amounts */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quick Add
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickWaterAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() =>
                                                setWaterAmount(
                                                    amount.toString()
                                                )
                                            }
                                            className="p-2 border rounded-md hover:bg-blue-50 hover:border-blue-500 transition duration-200"
                                        >
                                            {amount}ml
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add Water Button */}
                            <button
                                onClick={handleAddWater}
                                disabled={
                                    !waterAmount ||
                                    parseFloat(waterAmount) <= 0 ||
                                    loading
                                }
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Adding..." : "Add Water"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Custom Food Modal */}
            <AddCustomFoodModal
                isOpen={showCustomFoodModal}
                onClose={() => setShowCustomFoodModal(false)}
                onAdd={handleCustomFoodAdded}
            />
        </div>
    );
};

export default AddEntryModal;
