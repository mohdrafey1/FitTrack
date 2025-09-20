import { useState, useEffect } from "react";
import { customFoodAPI } from "../services/api";

const AddCustomFoodModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "other",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "0",
        sugar: "0",
        brand: "",
        description: "",
        servingSizes: {
            small: "50",
            medium: "100",
            large: "150",
        },
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const response = await customFoodAPI.getCategories();
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("servingSizes.")) {
            const sizeType = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                servingSizes: {
                    ...prev.servingSizes,
                    [sizeType]: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Food name is required";
        }

        if (!formData.calories || parseFloat(formData.calories) <= 0) {
            newErrors.calories = "Calories must be greater than 0";
        }

        if (formData.protein === "" || parseFloat(formData.protein) < 0) {
            newErrors.protein = "Protein cannot be negative";
        }

        if (formData.carbs === "" || parseFloat(formData.carbs) < 0) {
            newErrors.carbs = "Carbohydrates cannot be negative";
        }

        if (formData.fat === "" || parseFloat(formData.fat) < 0) {
            newErrors.fat = "Fat cannot be negative";
        }

        // Check if macros add up reasonably to calories
        const protein = parseFloat(formData.protein) || 0;
        const carbs = parseFloat(formData.carbs) || 0;
        const fat = parseFloat(formData.fat) || 0;
        const calories = parseFloat(formData.calories) || 0;

        const calculatedCalories = protein * 4 + carbs * 4 + fat * 9;
        const tolerance = calories * 0.2; // 20% tolerance

        if (Math.abs(calculatedCalories - calories) > tolerance) {
            newErrors.calories = `Calories don't match macros. Expected ~${Math.round(
                calculatedCalories
            )} calories`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const foodData = {
                ...formData,
                calories: parseFloat(formData.calories),
                protein: parseFloat(formData.protein),
                carbs: parseFloat(formData.carbs),
                fat: parseFloat(formData.fat),
                fiber: parseFloat(formData.fiber) || 0,
                sugar: parseFloat(formData.sugar) || 0,
                servingSizes: {
                    small: parseInt(formData.servingSizes.small),
                    medium: parseInt(formData.servingSizes.medium),
                    large: parseInt(formData.servingSizes.large),
                },
            };

            const response = await customFoodAPI.createCustomFood(foodData);
            if (response.data.success) {
                onAdd(response.data.data);
                handleClose();
            }
        } catch (error) {
            console.error("Error creating custom food:", error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert("Failed to create custom food. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            category: "other",
            calories: "",
            protein: "",
            carbs: "",
            fat: "",
            fiber: "0",
            sugar: "0",
            brand: "",
            description: "",
            servingSizes: {
                small: "50",
                medium: "100",
                large: "150",
            },
        });
        setErrors({});
        onClose();
    };

    const calculateMacroCalories = () => {
        const protein = parseFloat(formData.protein) || 0;
        const carbs = parseFloat(formData.carbs) || 0;
        const fat = parseFloat(formData.fat) || 0;
        return Math.round(protein * 4 + carbs * 4 + fat * 9);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Add Custom Food
                        </h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Basic Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Food Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        errors.name
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="e.g., Homemade Granola"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option
                                            key={cat.value}
                                            value={cat.value}
                                        >
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g., Homemade"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Additional details about this food..."
                            />
                        </div>
                    </div>

                    {/* Nutrition Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Nutrition (per 100g)
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Calories *
                                </label>
                                <input
                                    type="number"
                                    name="calories"
                                    value={formData.calories}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="1"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        errors.calories
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="kcal"
                                    required
                                />
                                {errors.calories && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.calories}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Protein *
                                </label>
                                <input
                                    type="number"
                                    name="protein"
                                    value={formData.protein}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        errors.protein
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="g"
                                    required
                                />
                                {errors.protein && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.protein}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Carbs *
                                </label>
                                <input
                                    type="number"
                                    name="carbs"
                                    value={formData.carbs}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        errors.carbs
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="g"
                                    required
                                />
                                {errors.carbs && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.carbs}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fat *
                                </label>
                                <input
                                    type="number"
                                    name="fat"
                                    value={formData.fat}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                        errors.fat
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="g"
                                    required
                                />
                                {errors.fat && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.fat}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fiber
                                </label>
                                <input
                                    type="number"
                                    name="fiber"
                                    value={formData.fiber}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="g"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sugar
                                </label>
                                <input
                                    type="number"
                                    name="sugar"
                                    value={formData.sugar}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="g"
                                />
                            </div>
                        </div>

                        {/* Calorie calculation helper */}
                        {(formData.protein ||
                            formData.carbs ||
                            formData.fat) && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-700">
                                    💡 Based on macros: ~
                                    {calculateMacroCalories()} calories
                                    {formData.calories &&
                                        Math.abs(
                                            calculateMacroCalories() -
                                                parseFloat(formData.calories)
                                        ) >
                                            parseFloat(formData.calories) *
                                                0.1 && (
                                            <span className="text-orange-600 font-medium">
                                                {" "}
                                                (Check your values)
                                            </span>
                                        )}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Serving Sizes */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Serving Sizes (grams)
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Small
                                </label>
                                <input
                                    type="number"
                                    name="servingSizes.small"
                                    value={formData.servingSizes.small}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Medium
                                </label>
                                <input
                                    type="number"
                                    name="servingSizes.medium"
                                    value={formData.servingSizes.medium}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Large
                                </label>
                                <input
                                    type="number"
                                    name="servingSizes.large"
                                    value={formData.servingSizes.large}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating..." : "Create Food"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomFoodModal;
