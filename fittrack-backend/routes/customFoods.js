const express = require("express");
const CustomFood = require("../models/CustomFood");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/custom-foods
// @desc    Get user's custom foods with optional search and filtering
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
    try {
        const { search, category, limit = 20, popular } = req.query;

        let foods;

        if (popular === "true") {
            foods = await CustomFood.getPopularFoods(
                req.user.id,
                parseInt(limit)
            );
        } else {
            foods = await CustomFood.searchUserFoods(
                req.user.id,
                search,
                category,
                parseInt(limit)
            );
        }

        res.json({
            success: true,
            data: foods,
            count: foods.length,
        });
    } catch (error) {
        console.error("Error fetching custom foods:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   GET /api/custom-foods/:id
// @desc    Get a specific custom food by ID
// @access  Private
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const food = await CustomFood.findOne({
            _id: req.params.id,
            user: req.user.id,
            isActive: true,
        });

        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food not found",
            });
        }

        res.json({
            success: true,
            data: food,
        });
    } catch (error) {
        console.error("Error fetching custom food:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   POST /api/custom-foods
// @desc    Create a new custom food
// @access  Private
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            name,
            category,
            calories,
            protein,
            carbs,
            fat,
            fiber = 0,
            sugar = 0,
            servingSizes,
            brand,
            description,
        } = req.body;

        // Validation
        if (
            !name ||
            !category ||
            !calories ||
            protein === undefined ||
            carbs === undefined ||
            fat === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: name, category, calories, protein, carbs, fat",
            });
        }

        // Check if food with same name already exists for this user
        const existingFood = await CustomFood.findOne({
            user: req.user.id,
            name: { $regex: new RegExp(`^${name}$`, "i") },
            isActive: true,
        });

        if (existingFood) {
            return res.status(400).json({
                success: false,
                message: "A food with this name already exists",
            });
        }

        // Create new custom food
        const customFood = new CustomFood({
            user: req.user.id,
            name: name.trim(),
            category,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat),
            fiber: parseFloat(fiber),
            sugar: parseFloat(sugar),
            servingSizes: servingSizes || {
                small: 50,
                medium: 100,
                large: 150,
            },
            brand: brand ? brand.trim() : undefined,
            description: description ? description.trim() : undefined,
        });

        await customFood.save();

        res.status(201).json({
            success: true,
            message: "Custom food created successfully",
            data: customFood,
        });
    } catch (error) {
        console.error("Error creating custom food:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   PUT /api/custom-foods/:id
// @desc    Update a custom food
// @access  Private
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const food = await CustomFood.findOne({
            _id: req.params.id,
            user: req.user.id,
            isActive: true,
        });

        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food not found",
            });
        }

        const {
            name,
            category,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            servingSizes,
            brand,
            description,
        } = req.body;

        // Check if updated name conflicts with another food
        if (name && name !== food.name) {
            const existingFood = await CustomFood.findOne({
                user: req.user.id,
                name: { $regex: new RegExp(`^${name}$`, "i") },
                _id: { $ne: food._id },
                isActive: true,
            });

            if (existingFood) {
                return res.status(400).json({
                    success: false,
                    message: "A food with this name already exists",
                });
            }
        }

        // Update fields
        if (name !== undefined) food.name = name.trim();
        if (category !== undefined) food.category = category;
        if (calories !== undefined) food.calories = parseFloat(calories);
        if (protein !== undefined) food.protein = parseFloat(protein);
        if (carbs !== undefined) food.carbs = parseFloat(carbs);
        if (fat !== undefined) food.fat = parseFloat(fat);
        if (fiber !== undefined) food.fiber = parseFloat(fiber);
        if (sugar !== undefined) food.sugar = parseFloat(sugar);
        if (servingSizes !== undefined) food.servingSizes = servingSizes;
        if (brand !== undefined) food.brand = brand ? brand.trim() : undefined;
        if (description !== undefined)
            food.description = description ? description.trim() : undefined;

        await food.save();

        res.json({
            success: true,
            message: "Custom food updated successfully",
            data: food,
        });
    } catch (error) {
        console.error("Error updating custom food:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   DELETE /api/custom-foods/:id
// @desc    Delete (deactivate) a custom food
// @access  Private
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const food = await CustomFood.findOne({
            _id: req.params.id,
            user: req.user.id,
            isActive: true,
        });

        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food not found",
            });
        }

        // Soft delete by setting isActive to false
        food.isActive = false;
        await food.save();

        res.json({
            success: true,
            message: "Custom food deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting custom food:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   POST /api/custom-foods/:id/use
// @desc    Increment usage count for a custom food
// @access  Private
router.post("/:id/use", authenticateToken, async (req, res) => {
    try {
        const food = await CustomFood.findOne({
            _id: req.params.id,
            user: req.user.id,
            isActive: true,
        });

        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food not found",
            });
        }

        await food.incrementUsage();

        res.json({
            success: true,
            message: "Usage count updated",
            data: food,
        });
    } catch (error) {
        console.error("Error updating usage count:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   GET /api/custom-foods/categories/list
// @desc    Get list of available categories
// @access  Private
router.get("/categories/list", authenticateToken, async (req, res) => {
    try {
        const categories = [
            { value: "protein", label: "Protein", icon: "🥩" },
            { value: "carbs", label: "Carbohydrates", icon: "🍞" },
            { value: "fruit", label: "Fruits", icon: "🍎" },
            { value: "vegetable", label: "Vegetables", icon: "🥬" },
            { value: "dairy", label: "Dairy", icon: "🥛" },
            { value: "nuts", label: "Nuts & Seeds", icon: "🥜" },
            { value: "snack", label: "Snacks", icon: "🍪" },
            { value: "beverage", label: "Beverages", icon: "🥤" },
            { value: "grain", label: "Grains", icon: "🌾" },
            { value: "fat", label: "Fats & Oils", icon: "🫒" },
            { value: "other", label: "Other", icon: "🍽️" },
        ];

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

module.exports = router;
