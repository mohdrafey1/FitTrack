const express = require("express");
const FoodEntry = require("../models/FoodEntry");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/food/today
// @desc    Get today's food entry for the authenticated user
// @access  Private
router.get("/today", authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        const entry = await FoodEntry.getOrCreateEntry(req.user.id, today);
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            data: entry,
        });
    } catch (error) {
        console.error("Error fetching today's entry:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   GET /api/food/date/:date
// @desc    Get food entry for a specific date
// @access  Private
router.get("/date/:date", authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;

        // Validate date format
        const requestedDate = new Date(date);
        if (isNaN(requestedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format",
            });
        }

        const entry = await FoodEntry.getOrCreateEntry(
            req.user.id,
            requestedDate
        );
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            data: entry,
        });
    } catch (error) {
        console.error("Error fetching entry for date:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   GET /api/food/history
// @desc    Get food entries for a date range (default: last 7 days)
// @access  Private
router.get("/history", authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, limit = 7 } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format",
                });
            }
        } else {
            // Default to last 7 days
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - (parseInt(limit) - 1));
        }

        const entries = await FoodEntry.getEntriesInRange(
            req.user.id,
            start,
            end
        );
        await FoodEntry.populate(entries, {
            path: "user",
            select: "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater",
        });

        res.json({
            success: true,
            data: entries,
            meta: {
                startDate: start,
                endDate: end,
                count: entries.length,
            },
        });
    } catch (error) {
        console.error("Error fetching food history:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   POST /api/food/add
// @desc    Add a food item to today's entry
// @access  Private
router.post("/add", authenticateToken, async (req, res) => {
    try {
        const {
            foodId,
            foodName,
            quantity,
            unit = "g",
            calories,
            protein,
            carbs,
            fat,
            servingSize,
        } = req.body;

        // Validation
        if (
            !foodId ||
            !foodName ||
            !quantity ||
            !calories ||
            protein === undefined ||
            carbs === undefined ||
            fat === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        const today = new Date();
        const entry = await FoodEntry.getOrCreateEntry(req.user.id, today);

        const foodData = {
            foodId: parseInt(foodId),
            foodName,
            quantity: parseFloat(quantity),
            unit,
            calories: parseFloat(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat),
            servingSize,
            timestamp: new Date(),
        };

        await entry.addFood(foodData);
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            message: "Food added successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error adding food:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   DELETE /api/food/remove/:entryId
// @desc    Remove a food item from today's entry
// @access  Private
router.delete("/remove/:entryId", authenticateToken, async (req, res) => {
    try {
        const { entryId } = req.params;
        const today = new Date();

        const entry = await FoodEntry.getOrCreateEntry(req.user.id, today);

        const foodEntry = entry.foods.id(entryId);
        if (!foodEntry) {
            return res.status(404).json({
                success: false,
                message: "Food entry not found",
            });
        }

        await entry.removeFood(entryId);
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            message: "Food removed successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error removing food:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   POST /api/food/water
// @desc    Update water intake for today
// @access  Private
router.post("/water", authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: "Valid water amount is required",
            });
        }

        const waterAmount = parseFloat(amount);

        if (waterAmount === 0) {
            return res.status(400).json({
                success: false,
                message: "Water amount cannot be zero",
            });
        }

        const today = new Date();
        const entry = await FoodEntry.getOrCreateEntry(req.user.id, today);

        await entry.updateWater(waterAmount);
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            message: `Water intake ${
                waterAmount > 0 ? "added" : "reduced"
            } successfully`,
            data: entry,
        });
    } catch (error) {
        console.error("Error updating water intake:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   PUT /api/food/water/set
// @desc    Set water intake for today (absolute value)
// @access  Private
router.put("/water/set", authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (amount === undefined || isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: "Valid water amount is required",
            });
        }

        const waterAmount = Math.max(0, parseFloat(amount));

        const today = new Date();
        const entry = await FoodEntry.getOrCreateEntry(req.user.id, today);

        entry.water = waterAmount;
        await entry.save();
        await entry.populate(
            "user",
            "firstName lastName targetDailyCalories targetDailyProteins targetDailyWater"
        );

        res.json({
            success: true,
            message: "Water intake updated successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error setting water intake:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// @route   GET /api/food/analytics
// @desc    Get nutrition analytics for the user
// @access  Private
router.get("/analytics", authenticateToken, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const numDays = Math.min(parseInt(days), 30); // Max 30 days

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (numDays - 1));

        const entries = await FoodEntry.getEntriesInRange(
            req.user.id,
            startDate,
            endDate
        );

        // Calculate analytics
        const totalEntries = entries.length;
        const totalCalories = entries.reduce(
            (sum, entry) => sum + entry.totalCalories,
            0
        );
        const totalProtein = entries.reduce(
            (sum, entry) => sum + entry.totalProtein,
            0
        );
        const totalWater = entries.reduce((sum, entry) => sum + entry.water, 0);

        const avgCalories =
            totalEntries > 0 ? Math.round(totalCalories / totalEntries) : 0;
        const avgProtein =
            totalEntries > 0
                ? Math.round((totalProtein / totalEntries) * 10) / 10
                : 0;
        const avgWater =
            totalEntries > 0 ? Math.round(totalWater / totalEntries) : 0;

        // Find best and worst days
        const bestCalorieDay = entries.reduce(
            (best, entry) =>
                entry.totalCalories > (best?.totalCalories || 0) ? entry : best,
            null
        );
        const bestProteinDay = entries.reduce(
            (best, entry) =>
                entry.totalProtein > (best?.totalProtein || 0) ? entry : best,
            null
        );
        const bestWaterDay = entries.reduce(
            (best, entry) => (entry.water > (best?.water || 0) ? entry : best),
            null
        );

        res.json({
            success: true,
            data: {
                period: {
                    days: numDays,
                    startDate,
                    endDate,
                },
                summary: {
                    totalEntries,
                    avgCalories,
                    avgProtein,
                    avgWater,
                    totalCalories,
                    totalProtein,
                    totalWater,
                },
                bestDays: {
                    calories: bestCalorieDay
                        ? {
                              date: bestCalorieDay.date,
                              value: bestCalorieDay.totalCalories,
                          }
                        : null,
                    protein: bestProteinDay
                        ? {
                              date: bestProteinDay.date,
                              value: bestProteinDay.totalProtein,
                          }
                        : null,
                    water: bestWaterDay
                        ? {
                              date: bestWaterDay.date,
                              value: bestWaterDay.water,
                          }
                        : null,
                },
                entries: entries.map((entry) => ({
                    date: entry.date,
                    calories: entry.totalCalories,
                    protein: entry.totalProtein,
                    carbs: entry.totalCarbs,
                    fat: entry.totalFat,
                    water: entry.water,
                    foodCount: entry.foods.length,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching analytics:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

module.exports = router;
