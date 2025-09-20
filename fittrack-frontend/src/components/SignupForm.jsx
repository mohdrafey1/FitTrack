import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const SignupForm = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        currentWeight: "",
        targetWeight: "",
        targetDailyCalories: "",
        targetDailyProteins: "",
        targetDailyWater: "",
        age: "",
        height: "",
        gender: "other",
        activityLevel: "moderately_active",
        fitnessGoal: "general_fitness",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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

        // Username validation
        if (!formData.username) {
            newErrors.username = "Username is required";
        } else if (formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username =
                "Username can only contain letters, numbers, and underscores";
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Weight validation
        if (!formData.currentWeight) {
            newErrors.currentWeight = "Current weight is required";
        } else if (
            isNaN(formData.currentWeight) ||
            formData.currentWeight < 20 ||
            formData.currentWeight > 300
        ) {
            newErrors.currentWeight =
                "Current weight must be between 20 and 300 kg";
        }

        if (!formData.targetWeight) {
            newErrors.targetWeight = "Target weight is required";
        } else if (
            isNaN(formData.targetWeight) ||
            formData.targetWeight < 20 ||
            formData.targetWeight > 300
        ) {
            newErrors.targetWeight =
                "Target weight must be between 20 and 300 kg";
        }

        // Calories validation
        if (!formData.targetDailyCalories) {
            newErrors.targetDailyCalories = "Target daily calories is required";
        } else if (
            isNaN(formData.targetDailyCalories) ||
            formData.targetDailyCalories < 800 ||
            formData.targetDailyCalories > 5000
        ) {
            newErrors.targetDailyCalories =
                "Target daily calories must be between 800 and 5000";
        }

        // Proteins validation
        if (!formData.targetDailyProteins) {
            newErrors.targetDailyProteins = "Target daily proteins is required";
        } else if (
            isNaN(formData.targetDailyProteins) ||
            formData.targetDailyProteins < 20 ||
            formData.targetDailyProteins > 500
        ) {
            newErrors.targetDailyProteins =
                "Target daily proteins must be between 20 and 500g";
        }

        // Water validation
        if (!formData.targetDailyWater) {
            newErrors.targetDailyWater = "Target daily water is required";
        } else if (
            isNaN(formData.targetDailyWater) ||
            formData.targetDailyWater < 500 ||
            formData.targetDailyWater > 10000
        ) {
            newErrors.targetDailyWater =
                "Target daily water must be between 500 and 10000ml";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        const loadingToast = toast.loading("Creating your account...");

        // Prepare data for API
        const userData = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            currentWeight: parseFloat(formData.currentWeight),
            targetWeight: parseFloat(formData.targetWeight),
            targetDailyCalories: parseInt(formData.targetDailyCalories),
            targetDailyProteins: parseInt(formData.targetDailyProteins),
            targetDailyWater: parseInt(formData.targetDailyWater),
            age: formData.age ? parseInt(formData.age) : undefined,
            height: formData.height ? parseInt(formData.height) : undefined,
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            fitnessGoal: formData.fitnessGoal,
        };

        const result = await signup(userData);
        toast.dismiss(loadingToast);
        setIsLoading(false);

        if (!result.success) {
            setErrors({ general: result.error });
            // Toast error is already handled in AuthContext
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Create Account
                </h2>
                <p className="text-gray-600">
                    Join FitTrack and start your fitness journey
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {errors.general}
                    </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Username *
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.username
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Choose a username"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email Address *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Enter your email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password *
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.password
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Create a password"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.confirmPassword
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>
                </div>

                {/* Weight Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="currentWeight"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Current Weight (kg) *
                        </label>
                        <input
                            type="number"
                            id="currentWeight"
                            name="currentWeight"
                            value={formData.currentWeight}
                            onChange={handleChange}
                            min="20"
                            max="300"
                            step="0.1"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.currentWeight
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="70"
                        />
                        {errors.currentWeight && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.currentWeight}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="targetWeight"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Target Weight (kg) *
                        </label>
                        <input
                            type="number"
                            id="targetWeight"
                            name="targetWeight"
                            value={formData.targetWeight}
                            onChange={handleChange}
                            min="20"
                            max="300"
                            step="0.1"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.targetWeight
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="65"
                        />
                        {errors.targetWeight && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.targetWeight}
                            </p>
                        )}
                    </div>
                </div>

                {/* Daily Targets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label
                            htmlFor="targetDailyCalories"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Daily Calories *
                        </label>
                        <input
                            type="number"
                            id="targetDailyCalories"
                            name="targetDailyCalories"
                            value={formData.targetDailyCalories}
                            onChange={handleChange}
                            min="800"
                            max="5000"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.targetDailyCalories
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="2000"
                        />
                        {errors.targetDailyCalories && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.targetDailyCalories}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="targetDailyProteins"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Daily Proteins (g) *
                        </label>
                        <input
                            type="number"
                            id="targetDailyProteins"
                            name="targetDailyProteins"
                            value={formData.targetDailyProteins}
                            onChange={handleChange}
                            min="20"
                            max="500"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.targetDailyProteins
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="150"
                        />
                        {errors.targetDailyProteins && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.targetDailyProteins}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="targetDailyWater"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Daily Water (ml) *
                        </label>
                        <input
                            type="number"
                            id="targetDailyWater"
                            name="targetDailyWater"
                            value={formData.targetDailyWater}
                            onChange={handleChange}
                            min="500"
                            max="10000"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.targetDailyWater
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                            placeholder="2500"
                        />
                        {errors.targetDailyWater && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.targetDailyWater}
                            </p>
                        )}
                    </div>
                </div>

                {/* Optional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label
                            htmlFor="age"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Age (optional)
                        </label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            min="13"
                            max="120"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="25"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="height"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Height (cm, optional)
                        </label>
                        <input
                            type="number"
                            id="height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            min="100"
                            max="250"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="170"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="gender"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Gender
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="other">Other</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="activityLevel"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Activity Level
                        </label>
                        <select
                            id="activityLevel"
                            name="activityLevel"
                            value={formData.activityLevel}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="sedentary">Sedentary</option>
                            <option value="lightly_active">
                                Lightly Active
                            </option>
                            <option value="moderately_active">
                                Moderately Active
                            </option>
                            <option value="very_active">Very Active</option>
                            <option value="extremely_active">
                                Extremely Active
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="fitnessGoal"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Fitness Goal
                        </label>
                        <select
                            id="fitnessGoal"
                            name="fitnessGoal"
                            value={formData.fitnessGoal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="general_fitness">
                                General Fitness
                            </option>
                            <option value="weight_loss">Weight Loss</option>
                            <option value="muscle_gain">Muscle Gain</option>
                            <option value="endurance">Endurance</option>
                            <option value="strength">Strength</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-600">
                    Already have an account?{" "}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Sign in here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
