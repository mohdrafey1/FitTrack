import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const SignupForm = () => {
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
    const navigate = useNavigate();

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
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
            currentWeight: parseFloat(formData.currentWeight) || undefined,
            targetWeight: parseFloat(formData.targetWeight) || undefined,
            targetDailyCalories:
                parseInt(formData.targetDailyCalories) || undefined,
            targetDailyProteins:
                parseInt(formData.targetDailyProteins) || undefined,
            targetDailyWater: parseInt(formData.targetDailyWater) || undefined,
            age: formData.age ? parseInt(formData.age) : undefined,
            height: formData.height ? parseInt(formData.height) : undefined,
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            fitnessGoal: formData.fitnessGoal,
        };

        const result = await signup(userData);
        toast.dismiss(loadingToast);
        setIsLoading(false);

        if (result.success) {
            navigate("/dashboard");
        } else {
            setErrors({ general: result.error });
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Create Your Account
                </h2>
                <p className="text-gray-600">
                    Set up your profile to get personalized fitness tracking
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{errors.general}</span>
                    </div>
                )}

                {/* Account Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span>Account Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label
                                htmlFor="username"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Username *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                        errors.username
                                            ? "border-red-300 ring-2 ring-red-200"
                                            : "border-gray-200"
                                    }`}
                                    placeholder="Choose a username"
                                />
                            </div>
                            {errors.username && (
                                <p className="text-red-500 text-sm flex items-center space-x-1">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>{errors.username}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Email Address *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                        errors.email
                                            ? "border-red-300 ring-2 ring-red-200"
                                            : "border-gray-200"
                                    }`}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm flex items-center space-x-1">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>{errors.email}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                        errors.password
                                            ? "border-red-300 ring-2 ring-red-200"
                                            : "border-gray-200"
                                    }`}
                                    placeholder="Create a strong password"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm flex items-center space-x-1">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                        errors.confirmPassword
                                            ? "border-red-300 ring-2 ring-red-200"
                                            : "border-gray-200"
                                    }`}
                                    placeholder="Confirm your password"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm flex items-center space-x-1">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>{errors.confirmPassword}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>Personal Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label
                                htmlFor="age"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Age
                            </label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                placeholder="25"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="height"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Height (cm)
                            </label>
                            <input
                                type="number"
                                id="height"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                placeholder="170"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="gender"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Gender
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fitness Goals */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                        <span>Fitness Goals</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label
                                htmlFor="currentWeight"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Current Weight (kg)
                            </label>
                            <input
                                type="number"
                                id="currentWeight"
                                name="currentWeight"
                                value={formData.currentWeight}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="70"
                                step="0.1"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="targetWeight"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Target Weight (kg)
                            </label>
                            <input
                                type="number"
                                id="targetWeight"
                                name="targetWeight"
                                value={formData.targetWeight}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="65"
                                step="0.1"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="fitnessGoal"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Fitness Goal
                            </label>
                            <select
                                id="fitnessGoal"
                                name="fitnessGoal"
                                value={formData.fitnessGoal}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="weight_loss">Weight Loss</option>
                                <option value="weight_gain">Weight Gain</option>
                                <option value="muscle_gain">Muscle Gain</option>
                                <option value="general_fitness">
                                    General Fitness
                                </option>
                                <option value="endurance">Endurance</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="activityLevel"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Activity Level
                            </label>
                            <select
                                id="activityLevel"
                                name="activityLevel"
                                value={formData.activityLevel}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                    </div>
                </div>

                {/* Daily Targets (Optional) */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        <span>Daily Targets (Optional)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label
                                htmlFor="targetDailyCalories"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Daily Calories
                            </label>
                            <input
                                type="number"
                                id="targetDailyCalories"
                                name="targetDailyCalories"
                                value={formData.targetDailyCalories}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                placeholder="2000"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="targetDailyProteins"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Daily Protein (g)
                            </label>
                            <input
                                type="number"
                                id="targetDailyProteins"
                                name="targetDailyProteins"
                                value={formData.targetDailyProteins}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                placeholder="150"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="targetDailyWater"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Daily Water (ml)
                            </label>
                            <input
                                type="number"
                                id="targetDailyWater"
                                name="targetDailyWater"
                                value={formData.targetDailyWater}
                                onChange={handleChange}
                                className="block w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                placeholder="2000"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                    {isLoading && (
                        <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    )}
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </form>
        </div>
    );
};

export default SignupForm;
