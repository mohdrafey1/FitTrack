const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { generateToken, authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const signupValidation = [
    body("username")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage(
            "Username can only contain letters, numbers, and underscores"
        ),
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    body("currentWeight")
        .isFloat({ min: 20, max: 300 })
        .withMessage("Current weight must be between 20 and 300 kg"),
    body("targetWeight")
        .isFloat({ min: 20, max: 300 })
        .withMessage("Target weight must be between 20 and 300 kg"),
    body("targetDailyCalories")
        .isInt({ min: 800, max: 5000 })
        .withMessage("Target daily calories must be between 800 and 5000"),
    body("targetDailyProteins")
        .isInt({ min: 20, max: 500 })
        .withMessage("Target daily proteins must be between 20 and 500g"),
    body("targetDailyWater")
        .isInt({ min: 500, max: 10000 })
        .withMessage("Target daily water must be between 500 and 10000ml"),
];

const loginValidation = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", signupValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: "Validation failed",
                details: errors.array(),
            });
        }

        const {
            username,
            email,
            password,
            currentWeight,
            targetWeight,
            targetDailyCalories,
            targetDailyProteins,
            targetDailyWater,
            age,
            height,
            gender,
            activityLevel,
            fitnessGoal,
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({
                error: "User already exists",
                message:
                    existingUser.email === email
                        ? "Email already registered"
                        : "Username already taken",
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            currentWeight,
            targetWeight,
            targetDailyCalories,
            targetDailyProteins,
            targetDailyWater,
            age,
            height,
            gender,
            activityLevel,
            fitnessGoal,
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return user data (without password)
        const userData = user.toJSON();
        delete userData.password;

        res.status(201).json({
            message: "User created successfully",
            token,
            user: userData,
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            error: "Server error",
            message: "Failed to create user account",
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: "Validation failed",
                details: errors.array(),
            });
        }

        const { email, password } = req.body;

        // Find user by email and include password for comparison
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                error: "Account deactivated",
                message: "Your account has been deactivated",
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid credentials",
                message: "Email or password is incorrect",
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return user data (without password)
        const userData = user.toJSON();
        delete userData.password;

        res.json({
            message: "Login successful",
            token,
            user: userData,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Server error",
            message: "Failed to login",
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
    try {
        res.json({
            user: req.user,
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            error: "Server error",
            message: "Failed to get user data",
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
    "/profile",
    authenticateToken,
    [
        body("currentWeight")
            .optional()
            .isFloat({ min: 20, max: 300 })
            .withMessage("Current weight must be between 20 and 300 kg"),
        body("targetWeight")
            .optional()
            .isFloat({ min: 20, max: 300 })
            .withMessage("Target weight must be between 20 and 300 kg"),
        body("targetDailyCalories")
            .optional()
            .isInt({ min: 800, max: 5000 })
            .withMessage("Target daily calories must be between 800 and 5000"),
        body("targetDailyProteins")
            .optional()
            .isInt({ min: 20, max: 500 })
            .withMessage("Target daily proteins must be between 20 and 500g"),
        body("targetDailyWater")
            .optional()
            .isInt({ min: 500, max: 10000 })
            .withMessage("Target daily water must be between 500 and 10000ml"),
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: errors.array(),
                });
            }

            const allowedUpdates = [
                "currentWeight",
                "targetWeight",
                "targetDailyCalories",
                "targetDailyProteins",
                "targetDailyWater",
                "age",
                "height",
                "gender",
                "activityLevel",
                "fitnessGoal",
            ];

            const updates = {};
            Object.keys(req.body).forEach((key) => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });

            const user = await User.findByIdAndUpdate(req.user._id, updates, {
                new: true,
                runValidators: true,
            });

            res.json({
                message: "Profile updated successfully",
                user,
            });
        } catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({
                error: "Server error",
                message: "Failed to update profile",
            });
        }
    }
);

module.exports = router;
