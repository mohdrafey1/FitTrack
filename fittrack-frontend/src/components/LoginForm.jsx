import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const LoginForm = ({ onSwitchToSignup }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

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

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        const loadingToast = toast.loading("Signing you in...");
        const result = await login(formData.email, formData.password);
        toast.dismiss(loadingToast);
        setIsLoading(false);

        if (!result.success) {
            setErrors({ general: result.error });
            // Toast error is already handled in AuthContext
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Welcome Back
                </h2>
                <p className="text-gray-600">
                    Sign in to your FitTrack account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {errors.general}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter your email"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Password
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
                        placeholder="Enter your password"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-600">
                    Don't have an account?{" "}
                    <button
                        onClick={onSwitchToSignup}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Sign up here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
