import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import toast from "react-hot-toast";

const ProfilePage = () => {
    const { user, updateProfile } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || "",
        currentWeight: user?.currentWeight || "",
        targetWeight: user?.targetWeight || "",
        targetDailyCalories: user?.targetDailyCalories || "",
        targetDailyProteins: user?.targetDailyProteins || "",
        targetDailyWater: user?.targetDailyWater || "",
        age: user?.age || "",
        height: user?.height || "",
        gender: user?.gender || "other",
        activityLevel: user?.activityLevel || "moderately_active",
        fitnessGoal: user?.fitnessGoal || "general_fitness",
    });
    const [errors, setErrors] = useState({});

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

        // Weight validation
        if (
            formData.currentWeight &&
            (formData.currentWeight < 20 || formData.currentWeight > 300)
        ) {
            newErrors.currentWeight = "Weight must be between 20-300 kg";
        }

        if (
            formData.targetWeight &&
            (formData.targetWeight < 20 || formData.targetWeight > 300)
        ) {
            newErrors.targetWeight = "Target weight must be between 20-300 kg";
        }

        // Age validation
        if (formData.age && (formData.age < 13 || formData.age > 120)) {
            newErrors.age = "Age must be between 13-120 years";
        }

        // Height validation
        if (
            formData.height &&
            (formData.height < 100 || formData.height > 250)
        ) {
            newErrors.height = "Height must be between 100-250 cm";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        const loadingToast = toast.loading("Updating profile...");

        try {
            // Prepare data for API (convert strings to numbers where needed)
            const profileData = {
                username: formData.username,
                email: formData.email,
                currentWeight: formData.currentWeight
                    ? parseFloat(formData.currentWeight)
                    : undefined,
                targetWeight: formData.targetWeight
                    ? parseFloat(formData.targetWeight)
                    : undefined,
                targetDailyCalories: formData.targetDailyCalories
                    ? parseInt(formData.targetDailyCalories)
                    : undefined,
                targetDailyProteins: formData.targetDailyProteins
                    ? parseInt(formData.targetDailyProteins)
                    : undefined,
                targetDailyWater: formData.targetDailyWater
                    ? parseInt(formData.targetDailyWater)
                    : undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                height: formData.height ? parseInt(formData.height) : undefined,
                gender: formData.gender,
                activityLevel: formData.activityLevel,
                fitnessGoal: formData.fitnessGoal,
            };

            const result = await updateProfile(profileData);

            if (result.success) {
                setIsEditing(false);
                toast.success("Profile updated successfully!");
            } else {
                setErrors({ general: result.error });
            }
        } catch (error) {
            console.error("Profile update error:", error);
            setErrors({
                general: "Failed to update profile. Please try again.",
            });
        } finally {
            toast.dismiss(loadingToast);
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form data to original user data
        setFormData({
            username: user?.username || "",
            email: user?.email || "",
            currentWeight: user?.currentWeight || "",
            targetWeight: user?.targetWeight || "",
            targetDailyCalories: user?.targetDailyCalories || "",
            targetDailyProteins: user?.targetDailyProteins || "",
            targetDailyWater: user?.targetDailyWater || "",
            age: user?.age || "",
            height: user?.height || "",
            gender: user?.gender || "other",
            activityLevel: user?.activityLevel || "moderately_active",
            fitnessGoal: user?.fitnessGoal || "general_fitness",
        });
        setErrors({});
        setIsEditing(false);
    };

    const getBMI = () => {
        if (user?.height && user?.currentWeight) {
            const heightInMeters = user.height / 100;
            return (
                user.currentWeight /
                (heightInMeters * heightInMeters)
            ).toFixed(1);
        }
        return "N/A";
    };

    const getBMICategory = (bmi) => {
        if (bmi === "N/A") return "Unknown";
        const numBMI = parseFloat(bmi);
        if (numBMI < 18.5) return "Underweight";
        if (numBMI < 25) return "Normal";
        if (numBMI < 30) return "Overweight";
        return "Obese";
    };

    const getWeightProgress = () => {
        if (user?.currentWeight && user?.targetWeight) {
            const difference = user.targetWeight - user.currentWeight;
            return {
                difference: Math.abs(difference).toFixed(1),
                type:
                    difference > 0
                        ? "gain"
                        : difference < 0
                        ? "lose"
                        : "maintain",
            };
        }
        return null;
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    const bmi = getBMI();
    const bmiCategory = getBMICategory(bmi);
    const weightProgress = getWeightProgress();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Header />

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* Header Section */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                My Profile
                            </h1>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">
                                Manage your account and fitness information
                            </p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                            >
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                                <span>Edit Profile</span>
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    /* Edit Mode */
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 sm:space-y-6 lg:space-y-8"
                    >
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center space-x-2 text-sm">
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0"
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
                                <span className="text-xs sm:text-sm">
                                    {errors.general}
                                </span>
                            </div>
                        )}

                        {/* Account Information */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
                                <span className="text-sm sm:text-base lg:text-lg">
                                    Account Information
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="username"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.username
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="Your username"
                                    />
                                    {errors.username && (
                                        <p className="text-red-500 text-xs sm:text-sm">
                                            {errors.username}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.email
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
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
                                <span className="text-sm sm:text-base lg:text-lg">
                                    Personal Information
                                </span>
                            </h2>

                            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="age"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.age
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="25"
                                    />
                                    {errors.age && (
                                        <p className="text-red-500 text-xs sm:text-sm">
                                            {errors.age}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="height"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        id="height"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.height
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="170"
                                    />
                                    {errors.height && (
                                        <p className="text-red-500 text-xs sm:text-sm">
                                            {errors.height}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="gender"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Gender
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Fitness Goals */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
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
                                <span className="text-sm sm:text-base lg:text-lg">
                                    Fitness Goals
                                </span>
                            </h2>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="currentWeight"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Current Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        id="currentWeight"
                                        name="currentWeight"
                                        value={formData.currentWeight}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.currentWeight
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="70"
                                        step="0.1"
                                    />
                                    {errors.currentWeight && (
                                        <p className="text-red-500 text-xs sm:text-sm">
                                            {errors.currentWeight}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="targetWeight"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Target Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        id="targetWeight"
                                        name="targetWeight"
                                        value={formData.targetWeight}
                                        onChange={handleChange}
                                        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                                            errors.targetWeight
                                                ? "border-red-300 ring-2 ring-red-200"
                                                : "border-gray-200"
                                        }`}
                                        placeholder="65"
                                        step="0.1"
                                    />
                                    {errors.targetWeight && (
                                        <p className="text-red-500 text-xs sm:text-sm">
                                            {errors.targetWeight}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                    <label
                                        htmlFor="fitnessGoal"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Fitness Goal
                                    </label>
                                    <select
                                        id="fitnessGoal"
                                        name="fitnessGoal"
                                        value={formData.fitnessGoal}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    >
                                        <option value="weight_loss">
                                            Weight Loss
                                        </option>
                                        <option value="weight_gain">
                                            Weight Gain
                                        </option>
                                        <option value="muscle_gain">
                                            Muscle Gain
                                        </option>
                                        <option value="general_fitness">
                                            General Fitness
                                        </option>
                                        <option value="endurance">
                                            Endurance
                                        </option>
                                        <option value="strength">
                                            Strength
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="activityLevel"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Activity Level
                                    </label>
                                    <select
                                        id="activityLevel"
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    >
                                        <option value="sedentary">
                                            Sedentary
                                        </option>
                                        <option value="lightly_active">
                                            Lightly Active
                                        </option>
                                        <option value="moderately_active">
                                            Moderately Active
                                        </option>
                                        <option value="very_active">
                                            Very Active
                                        </option>
                                        <option value="extremely_active">
                                            Extremely Active
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Daily Targets */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600"
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
                                <span className="text-sm sm:text-base lg:text-lg">
                                    Daily Targets
                                </span>
                            </h2>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="targetDailyCalories"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Daily Calories
                                    </label>
                                    <input
                                        type="number"
                                        id="targetDailyCalories"
                                        name="targetDailyCalories"
                                        value={formData.targetDailyCalories}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                        placeholder="2000"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="targetDailyProteins"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Daily Protein (g)
                                    </label>
                                    <input
                                        type="number"
                                        id="targetDailyProteins"
                                        name="targetDailyProteins"
                                        value={formData.targetDailyProteins}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                        placeholder="150"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                    <label
                                        htmlFor="targetDailyWater"
                                        className="block text-xs sm:text-sm font-semibold text-gray-700"
                                    >
                                        Daily Water (ml)
                                    </label>
                                    <input
                                        type="number"
                                        id="targetDailyWater"
                                        name="targetDailyWater"
                                        value={formData.targetDailyWater}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                        placeholder="2000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 sm:px-7 sm:py-2.5 lg:px-8 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
                            >
                                {isLoading && (
                                    <svg
                                        className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                                <span>
                                    {isLoading ? "Updating..." : "Save Changes"}
                                </span>
                            </button>
                        </div>
                    </form>
                ) : (
                    /* View Mode */
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                        {/* Profile Summary Cards */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                            {/* BMI Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-5 lg:p-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <svg
                                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white"
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
                                    </div>
                                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                                        {bmi}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        BMI
                                    </p>
                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                        {bmiCategory}
                                    </p>
                                </div>
                            </div>

                            {/* Weight Progress Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-5 lg:p-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <svg
                                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                                        {weightProgress
                                            ? `${weightProgress.difference} kg`
                                            : "N/A"}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        To {weightProgress?.type || "goal"}
                                    </p>
                                    <p className="text-xs text-green-600 font-medium mt-1">
                                        {user?.currentWeight || "N/A"} →{" "}
                                        {user?.targetWeight || "N/A"} kg
                                    </p>
                                </div>
                            </div>

                            {/* Activity Level Card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-5 lg:p-6 sm:col-span-2 lg:col-span-1">
                                <div className="text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <svg
                                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white"
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
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 capitalize">
                                        {user?.activityLevel?.replace(
                                            "_",
                                            " "
                                        ) || "Not set"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Activity Level
                                    </p>
                                    <p className="text-xs text-purple-600 font-medium mt-1 capitalize">
                                        {user?.fitnessGoal?.replace("_", " ") ||
                                            "General fitness"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
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
                                    <span>Personal Information</span>
                                </h2>

                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Username:
                                        </span>
                                        <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">
                                            {user?.username || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Email:
                                        </span>
                                        <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">
                                            {user?.email || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Age:
                                        </span>
                                        <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">
                                            {user?.age || "N/A"} years
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Height:
                                        </span>
                                        <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">
                                            {user?.height || "N/A"} cm
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-gray-600">
                                            Gender:
                                        </span>
                                        <span className="font-medium text-gray-800 capitalize text-xs sm:text-sm lg:text-base">
                                            {user?.gender || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Targets */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                                    <svg
                                        className="w-6 h-6 text-orange-600"
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
                                    <span>Daily Targets</span>
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Calories:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {user?.targetDailyCalories || "N/A"}{" "}
                                            kcal
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Protein:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {user?.targetDailyProteins || "N/A"}{" "}
                                            g
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Water:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {user?.targetDailyWater || "N/A"} ml
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Current Weight:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {user?.currentWeight || "N/A"} kg
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Target Weight:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {user?.targetWeight || "N/A"} kg
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
