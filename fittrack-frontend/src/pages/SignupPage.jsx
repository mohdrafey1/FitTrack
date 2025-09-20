import { Link } from "react-router-dom";
import SignupForm from "../components/SignupForm";

const SignupPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-32 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10">
                {/* Logo and Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent">
                        Join FitTrack
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Start your fitness transformation today. Create your
                        account to begin tracking your journey.
                    </p>
                </div>

                {/* Signup Form Container */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                    <SignupForm />

                    {/* Sign in link */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-100">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        By creating an account, you agree to our{" "}
                        <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                            Terms
                        </span>{" "}
                        and{" "}
                        <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                            Privacy Policy
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
